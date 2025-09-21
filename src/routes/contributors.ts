import { Router, Request, Response, NextFunction } from "express";

import { GitHubService } from "../services/githubServices";
import { validateParams } from "../middleware/validation";

const router = Router();
const githubService = new GitHubService();

/**
 * FOR YEAR
 * GET /:org/:repo/:year
 * Get new contributors for a specific year
 */
router.get(
  "/:org/:repo/:year",
  validateParams,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { org, repo, year } = req.params;

      console.log(
        `📊 Fetching yearly contributors for ${org}/${repo} in ${year}`,
      );

      const result = await githubService.getNewContributorsByMonth(
        org,
        repo,
        year,
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /:org/:repo/:year/:month
 * Get new contributors for a specific month
 */
router.get(
  "/:org/:repo/:year/:month",
  validateParams,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { org, repo, year, month } = req.params;

      console.log(
        `📊 Fetching monthly contributors for ${org}/${repo} in ${year}-${month}`,
      );

      const result = await githubService.getNewContributorsByMonth(
        org,
        repo,
        year,
        month,
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /cache/stats
 * Get cache statistics (for monitoring)
 */
router.get("/cache/stats", (_req: Request, res: Response) => {
  const stats = githubService.getCacheStats();
  res.status(200).json({
    message: "Cache statistics",
    ...stats,
    timestamp: new Date().toISOString(),
  });
});

export { router as contributorsRouter };
