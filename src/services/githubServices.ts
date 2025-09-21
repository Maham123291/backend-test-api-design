import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import NodeCache from "node-cache";

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    id: number;
  } | null;
}

export interface Repository {
  name: string;
  full_name: string;
  created_at: string;
  default_branch: string;
}

export interface ContributorData {
  org: string;
  repository: string;
  year: string;
  month?: string;
  newContributors: number;
}

export class GitHubService {
  private client: AxiosInstance;
  private cache: NodeCache;
  private requestCount: number = 0;
  private lastResetTime: number = Date.now();
  private readonly RATE_LIMIT_PER_HOUR = parseInt(
    process.env.GITHUB_REQUESTS_PER_HOUR || "5000",
  );

  constructor() {
    this.client = axios.create({
      baseURL: "https://api.github.com",
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitHub-Contributors-API/1.0.0",
      },
      timeout: 30000,
    });

  
    if (process.env.GITHUB_TOKEN) {
      this.client.defaults.headers.common["Authorization"] =
        `token ${process.env.GITHUB_TOKEN}`;
    }


    this.cache = new NodeCache({
      stdTTL: parseInt(process.env.CACHE_TTL || "86400"),
      checkperiod: 600, 
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
   
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        await this.checkRateLimit();
        this.requestCount++;
        return config;
      },
    );

    this.client.interceptors.response.use(
      (response) => {
    
        const remaining = response.headers["x-ratelimit-remaining"];

        if (remaining && parseInt(remaining) < 100) {
          console.warn(
            `⚠️  GitHub API rate limit low: ${remaining} requests remaining`,
          );
        }

        return response;
      },
      async (error) => {
        if (
          error.response?.status === 403 &&
          error.response?.headers["x-ratelimit-remaining"] === "0"
        ) {
          const resetTime =
            parseInt(error.response.headers["x-ratelimit-reset"]) * 1000;
          const waitTime = resetTime - Date.now();

          if (waitTime > 0) {
            console.log(
              `⏰ Rate limit exceeded. Waiting ${Math.ceil(waitTime / 1000)} seconds...`,
            );
            await this.sleep(waitTime);
            return this.client.request(error.config);
          }
        }

        if (error.response?.status >= 500 || error.code === "ECONNRESET") {
          console.log(
            `🔄 Retrying request due to ${error.response?.status || error.code}...`,
          );
          await this.sleep(1000);
          return this.client.request(error.config);
        }

        throw error;
      },
    );
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceReset = now - this.lastResetTime;

    // Reset counter every hour
    if (timeSinceReset >= 3600000) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    if (this.requestCount >= this.RATE_LIMIT_PER_HOUR) {
      const waitTime = 3600000 - timeSinceReset;
      console.log(
        `⏰ Self-imposed rate limit reached. Waiting ${Math.ceil(waitTime / 1000)} seconds...`,
      );
      await this.sleep(waitTime);
      this.requestCount = 0;
      this.lastResetTime = Date.now();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getRepository(org: string, repo: string): Promise<Repository> {
    const cacheKey = `repo:${org}:${repo}`;
    const cached = this.cache.get<Repository>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const response = await this.client.get(`/repos/${org}/${repo}`);
      const repository: Repository = response.data;

      this.cache.set(cacheKey, repository);
      return repository;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Repository ${org}/${repo} not found`);
      }
      throw new Error(`Failed to fetch repository: ${error.message}`);
    }
  }

  async getCommits(
    org: string,
    repo: string,
    since?: string,
    until?: string,
    page: number = 1,
  ): Promise<GitHubCommit[]> {
    const cacheKey = `commits:${org}:${repo}:${since}:${until}:${page}`;
    const cached = this.cache.get<GitHubCommit[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const params: any = {
        page,
        per_page: 100,
      };

      if (since) params.since = since;
      if (until) params.until = until;

      const response = await this.client.get(`/repos/${org}/${repo}/commits`, {
        params,
      });
      const commits: GitHubCommit[] = response.data;

  
      const cacheTime =
        since && new Date(since) > new Date(Date.now() - 86400000) ? 300 : 3600;
      this.cache.set(cacheKey, commits, cacheTime);

      return commits;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Repository ${org}/${repo} not found`);
      }
      if (error.response?.status === 409) {
        // Empty repository
        return [];
      }
      throw new Error(`Failed to fetch commits: ${error.message}`);
    }
  }

  async getNewContributorsByMonth(
    org: string,
    repo: string,
    year: string,
    month?: string,
  ): Promise<ContributorData> {
    const cacheKey = `contributors:${org}:${repo}:${year}:${month || "all"}`;
    const cached = this.cache.get<ContributorData>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      
      const repository = await this.getRepository(org, repo);
      const repoCreatedAt = new Date(repository.created_at);

      let startDate: Date;
      let endDate: Date;

      if (month) {
     
        startDate = new Date(`${year}-${month.padStart(2, "0")}-01`);
        endDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth() + 1,
          0,
          23,
          59,
          59,
        );
      } else {
        // Entire year
        startDate = new Date(`${year}-01-01`);
        endDate = new Date(`${year}-12-31T23:59:59`);
      }

      // Don't fetch data before repository was created
      if (startDate < repoCreatedAt) {
        startDate = repoCreatedAt;
      }

      // Track contributors we've seen before this period
      const existingContributors = new Set<string>();
      const newContributorsInPeriod = new Set<string>();

      // First, get all contributors before the target period
      if (startDate > repoCreatedAt) {
        const beforePeriodCommits = await this.getAllCommitsPaginated(
          org,
          repo,
          repoCreatedAt.toISOString(),
          startDate.toISOString(),
        );

        beforePeriodCommits.forEach((commit) => {
          if (commit.author?.login) {
            existingContributors.add(commit.author.login);
          }
        });
      }

      // Then get commits in the target period
      const periodCommits = await this.getAllCommitsPaginated(
        org,
        repo,
        startDate.toISOString(),
        endDate.toISOString(),
      );

      // Find new contributors in this period
      periodCommits.forEach((commit) => {
        if (
          commit.author?.login &&
          !existingContributors.has(commit.author.login)
        ) {
          newContributorsInPeriod.add(commit.author.login);
          existingContributors.add(commit.author.login); 
        }
      });

      const result: ContributorData = {
        org,
        repository: repo,
        year,
        ...(month && { month }),
        newContributors: newContributorsInPeriod.size,
      };

      // Cache the result
      this.cache.set(cacheKey, result);
      return result;
    } catch (error: any) {
      throw new Error(`Failed to analyze contributors: ${error.message}`);
    }
  }

  private async getAllCommitsPaginated(
    org: string,
    repo: string,
    since: string,
    until: string,
  ): Promise<GitHubCommit[]> {
    const allCommits: GitHubCommit[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const commits = await this.getCommits(org, repo, since, until, page);

      if (commits.length === 0) {
        hasMore = false;
      } else {
        allCommits.push(...commits);
        page++;

        
        if (commits.length < 100) {
          hasMore = false;
        }
      }

  
      if (page > 1000) {
        console.warn(`⚠️  Reached maximum page limit for ${org}/${repo}`);
        break;
      }
    }

    return allCommits;
  }

  getCacheStats() {
    return {
      keys: this.cache.keys().length,
      stats: this.cache.getStats(),
    };
  }
}
