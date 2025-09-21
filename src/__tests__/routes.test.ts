import request from "supertest";
import express from "express";


const mockGetNewContributorsByMonth = jest.fn();
const mockGetCacheStats = jest.fn();


jest.mock("../services/githubServices", () => {
  return {
    GitHubService: jest.fn().mockImplementation(() => ({
      getNewContributorsByMonth: mockGetNewContributorsByMonth,
      getCacheStats: mockGetCacheStats,
      getRepository: jest.fn(),
      getCommits: jest.fn(),
    }))
  };
});


import { contributorsRouter } from "../routes/contributors";
import { errorHandler } from "../middleware/errorHandler";

describe("Contributors Routes", () => {
  let app: express.Application;

  beforeEach(() => {

    app = express();
    app.use(express.json());
    app.use("/", contributorsRouter);
    app.use(errorHandler);
    
   
    jest.clearAllMocks();
  });

  describe("GET /:org/:repo/:year", () => {
    it("should return yearly contributor data with valid parameters", async () => {
      const mockData = {
        org: "airbnb",
        repository: "javascript",
        year: "2023",
        newContributors: 15,
      };

     
      mockGetNewContributorsByMonth.mockResolvedValue(mockData);

      const response = await request(app)
        .get("/airbnb/javascript/2023")
        .expect(200);

      expect(response.body).toEqual(mockData);
      expect(mockGetNewContributorsByMonth).toHaveBeenCalledWith("airbnb", "javascript", "2023");
    });

    it("should return 400 for invalid year", async () => {
      const response = await request(app)
        .get("/airbnb/javascript/2050")
        .expect(400);

      expect(response.body.error).toBe("Invalid year");
    });

    it("should return 400 for invalid organization name", async () => {
      const response = await request(app).get("/!/javascript/2023").expect(400);

      expect(response.body.error).toBe("Invalid organization name format");
    });
  });

  describe("GET /:org/:repo/:year/:month", () => {
    it("should return monthly contributor data with valid parameters", async () => {
      const mockData = {
        org: "airbnb",
        repository: "javascript",
        year: "2023",
        month: "06",
        newContributors: 3,
      };

      // Set up the mock to return our data
      mockGetNewContributorsByMonth.mockResolvedValue(mockData);

      const response = await request(app)
        .get("/airbnb/javascript/2023/6")
        .expect(200);

      expect(response.body).toEqual(mockData);
      expect(mockGetNewContributorsByMonth).toHaveBeenCalledWith("airbnb", "javascript", "2023", "6");
    });

    it("should return 400 for invalid month", async () => {
      const response = await request(app)
        .get("/airbnb/javascript/2023/13")
        .expect(400);

      expect(response.body.error).toBe("Invalid month");
    });

    it("should return 400 for future dates", async () => {
      const futureYear = new Date().getFullYear() + 1;
      const response = await request(app)
        .get(`/airbnb/javascript/${futureYear}/1`)
        .expect(400);

      expect(response.body.error).toBe("Invalid year");
    });
  });

  describe("GET /cache/stats", () => {
    it("should return cache statistics", async () => {
      const mockStats = {
        keys: 5,
        stats: { 
          hits: 10, 
          misses: 2,
          keys: 5,
          ksize: 1024,
          vsize: 2048
        },
      };

      // Set up the mock to return our stats
      mockGetCacheStats.mockReturnValue(mockStats);

      const response = await request(app).get("/cache/stats").expect(200);

      expect(response.body).toHaveProperty("keys");
      expect(response.body).toHaveProperty("stats");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body.keys).toBe(5);
      expect(response.body.stats.hits).toBe(10);
      expect(response.body.stats.misses).toBe(2);
    });
  });
});