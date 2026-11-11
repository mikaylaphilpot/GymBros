import type { ErrorRequestHandler } from "express";

// AI-assisted: centralized Express error responses keep status handling and
// development-only stack details consistent across active TypeScript routes.
const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode =
    typeof res.statusCode === "number" && res.statusCode >= 400
      ? res.statusCode
      : 500;

  console.error("Unhandled request error:", error);
  res.status(statusCode).json({
    message: error instanceof Error ? error.message : "Internal server error",
    ...(process.env.NODE_ENV === "production"
      ? {}
      : { stack: error instanceof Error ? error.stack : undefined }),
  });
};

export default errorHandler;
