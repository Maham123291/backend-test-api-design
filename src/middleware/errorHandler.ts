import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,

  _next: NextFunction,
): void => {
  console.error("❌ Error occurred:", {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Default error
  let statusCode = 500;
  let message = "Internal server error";


  if (error.message.includes("not found")) {
    statusCode = 404;
    message = error.message;
  } else if (error.message.includes("Rate limit")) {
    statusCode = 429;
    message = "GitHub API rate limit exceeded. Please try again later.";
  } else if (error.message.includes("timeout")) {
    statusCode = 504;
    message = "GitHub API request timeout. Please try again later.";
  } else if (error.message.includes("Failed to fetch")) {
    statusCode = 502;
    message = "Unable to fetch data from GitHub API. Please try again later.";
  } else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // Send error response
  res.status(statusCode).json({
    error: statusCode >= 500 ? "Internal Server Error" : "Bad Request",
    message,
    timestamp: new Date().toISOString(),
    path: req.url,
    ...(process.env.NODE_ENV === "development" && {
      stack: error.stack,
    }),
  });
};
