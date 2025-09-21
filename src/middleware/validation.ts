import { Request, Response, NextFunction } from "express";

export const validateParams = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { org, repo, year, month } = req.params;

  // Validate organization name
  if (!org || org.length < 1 || org.length > 39) {
    res.status(400).json({
      error: "Invalid organization name",
      message: "Organization name must be between 1 and 39 characters",
    });
    return;
  }

  // Validate repository name
  if (!repo || repo.length < 1 || repo.length > 100) {
    res.status(400).json({
      error: "Invalid repository name",
      message: "Repository name must be between 1 and 100 characters",
    });
    return;
  }

  // Validate year
  const yearNum = parseInt(year);
  const currentYear = new Date().getFullYear();
  if (isNaN(yearNum) || yearNum < 2008 || yearNum > currentYear) {
    res.status(400).json({
      error: "Invalid year",
      message: `Year must be a valid number between 2008 and ${currentYear}`,
    });
    return;
  }

  // Validate month if provided
  if (month) {
    const monthNum = parseInt(month);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      res.status(400).json({
        error: "Invalid month",
        message: "Month must be a valid number between 1 and 12",
      });
      return;
    }

    // Check if the date is not in the future
    const targetDate = new Date(yearNum, monthNum - 1);
    const now = new Date();
    if (targetDate > now) {
      res.status(400).json({
        error: "Invalid date",
        message: "Cannot fetch data for future dates",
      });
      return;
    }
  }

  // Validate against GitHub naming conventions
  const githubNamePattern = /^[a-zA-Z0-9._-]+$/;
  if (!githubNamePattern.test(org)) {
    res.status(400).json({
      error: "Invalid organization name format",
      message:
        "Organization name can only contain letters, numbers, hyphens, underscores, and dots",
    });
    return;
  }

  if (!githubNamePattern.test(repo)) {
    res.status(400).json({
      error: "Invalid repository name format",
      message:
        "Repository name can only contain letters, numbers, hyphens, underscores, and dots",
    });
    return;
  }

  next();
};
