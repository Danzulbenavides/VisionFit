import mongoose from "mongoose";

import ApiError from "./ApiError.js";

export const requireFields = (body, fields) => {
  const missingFields = fields.filter((field) => {
    const value = body[field];

    return (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    );
  });

  if (missingFields.length > 0) {
    throw new ApiError(
      400,
      `Required fields missing: ${missingFields.join(", ")}`,
    );
  }
};

export const validateObjectId = (value, fieldName = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
};

export const validateEnum = (value, allowedValues, fieldName) => {
  if (!allowedValues.includes(value)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
};

export const validatePositiveInteger = (value, fieldName) => {
  if (!Number.isInteger(value) || value < 1) {
    throw new ApiError(400, `${fieldName} must be a positive integer`);
  }
};

export const validateObjectIdParam = (paramName, label) => {
  return (req, res, next) => {
    const value = req.params[paramName];

    if (!mongoose.Types.ObjectId.isValid(value)) {
      return next(new ApiError(400, `Invalid ${label}`));
    }

    next();
  };
};
