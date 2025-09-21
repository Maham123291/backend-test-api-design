import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import favicon from "serve-favicon";
import path from "path";

import { contributorsRouter } from "./routes/contributors";
import { errorHandler } from "./middleware/errorHandler";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


console.log("Environment Variables Check:");
console.log("GITHUB_TOKEN:", process.env.GITHUB_TOKEN ? "✅ Loaded" : "❌ Missing");
console.log("CACHE_TTL:", process.env.CACHE_TTL || "❌ Missing (using default)");
console.log("NODE_ENV:", process.env.NODE_ENV || "development");

app.use(favicon(path.join(__dirname, "../public", "favicon.ico")));

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());


app.get("/", (_req, res) => {
  res.status(200).json({
    name: "GitHub Contributors API",
    version: "1.0.0",
    description: "API to analyze new contributors for any GitHub repository",
    endpoints: {
      "GET /health": "Health check",
      "GET /:org/:repo/:year": "Get yearly new contributors",
      "GET /:org/:repo/:year/:month": "Get monthly new contributors", 
      "GET /cache/stats": "Get cache statistics"
    },
    examples: {
      yearly: "/microsoft/vscode/2024",
      monthly: "/airbnb/javascript/2023/6"
    },

  });
});


app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    authentication: process.env.GITHUB_TOKEN ? "configured" : "missing",
    rateLimit: process.env.GITHUB_TOKEN ? "5000/hour" : "60/hour",
    cacheConfiguration: {
      ttl: process.env.CACHE_TTL || "3600 (default)",
      ttlHours: Math.round((parseInt(process.env.CACHE_TTL || "3600")) / 3600)
    }
  });
});


app.use("/", contributorsRouter);


app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      "GET /",
      "GET /:org/:repo/:year",
      "GET /:org/:repo/:year/:month", 
      "GET /health",
      "GET /cache/stats"
    ],
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API Documentation: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`🐙 GitHub Token: ${process.env.GITHUB_TOKEN ? "✅ Configured" : "❌ Missing (rate limited to 60/hour)"}`);
  console.log(`⏰ Cache TTL: ${process.env.CACHE_TTL || "3600 (default)"} seconds`);
});