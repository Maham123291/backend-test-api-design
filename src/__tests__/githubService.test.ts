import { GitHubService } from "../services/githubServices";
import axios from "axios";


jest.mock("axios", () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));


jest.mock("node-cache", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    keys: jest.fn(() => []),
    getStats: jest.fn(() => ({ hits: 0, misses: 0 })),
  }));
});

// Type the mocked axios
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("GitHubService", () => {
  let githubService: GitHubService;
  let mockAxiosInstance: any;

  beforeEach(() => {

    jest.clearAllMocks();


    mockAxiosInstance = {
      get: jest.fn(),
      defaults: { headers: { common: {} } },
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Creating service instance
    githubService = new GitHubService();
  });

  describe("getRepository", () => {
    it("should fetch repository information", async () => {
      const mockRepo = {
        name: "react",
        full_name: "facebook/react",
        created_at: "2013-05-24T16:15:54Z",
        default_branch: "main",
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockRepo });

      const result = await githubService.getRepository("facebook", "react");

      expect(result).toEqual(mockRepo);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/repos/facebook/react",
      );
    });

    it("should throw error for non-existent repository", async () => {
      mockAxiosInstance.get.mockRejectedValue({
        response: { status: 404 },
      });

      await expect(
        githubService.getRepository("nonexistent", "repo"),
      ).rejects.toThrow("Repository nonexistent/repo not found");
    });
  });

  describe("getCacheStats", () => {
    it("should return cache statistics", () => {
      const stats = githubService.getCacheStats();

      expect(stats).toHaveProperty("keys");
      expect(stats).toHaveProperty("stats");
      expect(typeof stats.keys).toBe("number");
    });
  });
});
