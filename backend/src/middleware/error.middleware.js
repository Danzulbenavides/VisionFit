import mongoose from "mongoose";

export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);

  error.statusCode = 404;

  next(error);
};

export const errorHandler = (error, req, res, next) => {
  console.error(`[${req.method} ${req.originalUrl}]`, error);

  let statusCode = error.statusCode || 500;

  let message = error.message || "Internal server error";

  // -----------------------------------------
  // Mongoose validation error
  // -----------------------------------------

  if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;

    message = Object.values(error.errors)
      .map((item) => item.message)
      .join(", ");
  }

  // -----------------------------------------
  // Invalid ObjectId / CastError
  // -----------------------------------------

  if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${error.path}`;
  }

  // -----------------------------------------
  // Duplicate key
  // -----------------------------------------

  if (error.code === 11000) {
    statusCode = 409;

    const duplicateFields = Object.keys(error.keyPattern || {});

    message =
      duplicateFields.length > 0
        ? `Duplicate value for: ${duplicateFields.join(", ")}`
        : "Duplicate resource";
  }

  // -----------------------------------------
  // JSON parsing error
  // -----------------------------------------

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    statusCode = 400;
    message = "Invalid JSON request body";
  }

  // -----------------------------------------
  // Hide unexpected internal errors
  // -----------------------------------------

  if (statusCode >= 500) {
    message = "Internal server error";
  }

  return res.status(statusCode).json({
    data: null,
    error: {
      message,
    },
  });
};
