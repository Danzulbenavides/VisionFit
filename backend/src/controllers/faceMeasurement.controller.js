import mongoose from "mongoose";

import FaceMeasurement from "../models/FaceMeasurement.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// =========================================
// CREATE FACE MEASUREMENT
// =========================================

export const createFaceMeasurement = asyncHandler(async (req, res) => {
  const {
    faceShape,
    pupilDistance,
    faceWidth,
    faceLength,
    scanImageUrl,
    confidence,
  } = req.body;

  // -----------------------------------------
  // 1. Required fields
  // -----------------------------------------

  if (!faceShape) {
    throw new ApiError(400, "Face shape is required");
  }

  if (pupilDistance === undefined) {
    throw new ApiError(400, "Pupil distance is required");
  }

  if (faceWidth === undefined) {
    throw new ApiError(400, "Face width is required");
  }

  if (faceLength === undefined) {
    throw new ApiError(400, "Face length is required");
  }

  if (confidence === undefined) {
    throw new ApiError(400, "Confidence is required");
  }

  // -----------------------------------------
  // 2. Validate face shape
  // -----------------------------------------

  const allowedFaceShapes = ["OVAL", "ROUND", "SQUARE", "HEART"];

  if (!allowedFaceShapes.includes(faceShape)) {
    throw new ApiError(400, "Invalid face shape");
  }

  // -----------------------------------------
  // 3. Validate numeric values
  // -----------------------------------------

  if (
    typeof pupilDistance !== "number" ||
    pupilDistance < 20 ||
    pupilDistance > 90
  ) {
    throw new ApiError(400, "Pupil distance must be between 20 and 90");
  }

  if (typeof faceWidth !== "number" || faceWidth < 50 || faceWidth > 300) {
    throw new ApiError(400, "Face width must be between 50 and 300");
  }

  if (typeof faceLength !== "number" || faceLength < 50 || faceLength > 300) {
    throw new ApiError(400, "Face length must be between 50 and 300");
  }

  if (typeof confidence !== "number" || confidence < 0 || confidence > 1) {
    throw new ApiError(400, "Confidence must be between 0 and 1");
  }

  // -----------------------------------------
  // 4. Create measurement
  // -----------------------------------------

  const measurement = await FaceMeasurement.create({
    userId: req.user.userId,
    faceShape,
    pupilDistance,
    faceWidth,
    faceLength,
    scanImageUrl: scanImageUrl || null,
    confidence,
  });

  return res.status(201).json({
    data: measurement,
    error: null,
  });
});

// =========================================
// GET ALL FACE MEASUREMENTS
// =========================================

export const getFaceMeasurements = asyncHandler(async (req, res) => {
  const measurements = await FaceMeasurement.find({
    userId: req.user.userId,
  }).sort({
    createdAt: -1,
  });

  return res.status(200).json({
    data: measurements,
    error: null,
  });
});

// =========================================
// GET ONE FACE MEASUREMENT
// =========================================

export const getFaceMeasurementById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // -----------------------------------------
  // Validate ID
  // -----------------------------------------

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid face measurement ID");
  }

  // -----------------------------------------
  // Ownership check
  // -----------------------------------------

  const measurement = await FaceMeasurement.findOne({
    _id: id,
    userId: req.user.userId,
  });

  if (!measurement) {
    throw new ApiError(404, "Face measurement not found");
  }

  return res.status(200).json({
    data: measurement,
    error: null,
  });
});

// =========================================
// DELETE FACE MEASUREMENT
// =========================================

export const deleteFaceMeasurement = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // -----------------------------------------
  // Validate ID
  // -----------------------------------------

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid face measurement ID");
  }

  // -----------------------------------------
  // Ownership check + delete
  // -----------------------------------------

  const measurement = await FaceMeasurement.findOneAndDelete({
    _id: id,
    userId: req.user.userId,
  });

  if (!measurement) {
    throw new ApiError(404, "Face measurement not found");
  }

  return res.status(200).json({
    data: {
      message: "Face measurement deleted successfully",
    },
    error: null,
  });
});
