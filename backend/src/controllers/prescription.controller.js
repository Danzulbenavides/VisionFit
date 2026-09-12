import Prescription from "../models/Prescription.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

import {
  requireFields,
  validateObjectId,
  validateEnum,
} from "../utils/validation.js";

// =========================================
// SHARED VALIDATION
// =========================================

const validateEye = (eye, eyeName) => {
  if (!eye || typeof eye !== "object" || Array.isArray(eye)) {
    throw new ApiError(400, `${eyeName} must be an object`);
  }

  if (
    typeof eye.sph !== "number" ||
    !Number.isFinite(eye.sph) ||
    eye.sph < -30 ||
    eye.sph > 30
  ) {
    throw new ApiError(400, `${eyeName}.sph must be between -30 and 30`);
  }

  if (
    typeof eye.cyl !== "number" ||
    !Number.isFinite(eye.cyl) ||
    eye.cyl < -10 ||
    eye.cyl > 10
  ) {
    throw new ApiError(400, `${eyeName}.cyl must be between -10 and 10`);
  }

  if (!Number.isInteger(eye.axis) || eye.axis < 0 || eye.axis > 180) {
    throw new ApiError(400, `${eyeName}.axis must be between 0 and 180`);
  }

  if (
    eye.add !== undefined &&
    (typeof eye.add !== "number" ||
      !Number.isFinite(eye.add) ||
      eye.add < 0 ||
      eye.add > 6)
  ) {
    throw new ApiError(400, `${eyeName}.add must be between 0 and 6`);
  }
};

// =========================================
// CREATE PRESCRIPTION
// =========================================

export const createPrescription = asyncHandler(async (req, res) => {
  const {
    name,
    prescriptionType,
    OD,
    OS,
    pd,
    hasPrism,
    prescriptionImageUrl,
    notes,
  } = req.body;

  // -----------------------------------------
  // Required fields
  // -----------------------------------------

  requireFields(req.body, ["name", "prescriptionType", "OD", "OS", "pd"]);

  // -----------------------------------------
  // Prescription type
  // -----------------------------------------

  validateEnum(
    prescriptionType,
    ["SINGLE_VISION", "PROGRESSIVE", "READING", "NON_PRESCRIPTION"],
    "prescription type",
  );

  // -----------------------------------------
  // Basic object checks
  // -----------------------------------------

  if (!OD || typeof OD !== "object" || Array.isArray(OD)) {
    throw new ApiError(400, "OD prescription data is required");
  }

  if (!OS || typeof OS !== "object" || Array.isArray(OS)) {
    throw new ApiError(400, "OS prescription data is required");
  }

  // -----------------------------------------
  // Name validation
  // -----------------------------------------

  if (typeof name !== "string" || name.trim() === "") {
    throw new ApiError(400, "Prescription name is required");
  }

  // -----------------------------------------
  // Validate eye data
  // -----------------------------------------

  validateEye(OD, "OD");
  validateEye(OS, "OS");

  // -----------------------------------------
  // Validate PD
  // -----------------------------------------

  if (typeof pd !== "number" || !Number.isFinite(pd) || pd < 20 || pd > 90) {
    throw new ApiError(400, "Pupillary distance must be between 20 and 90");
  }

  // -----------------------------------------
  // Validate optional fields
  // -----------------------------------------

  if (hasPrism !== undefined && typeof hasPrism !== "boolean") {
    throw new ApiError(400, "hasPrism must be a boolean");
  }

  if (
    prescriptionImageUrl !== undefined &&
    prescriptionImageUrl !== null &&
    typeof prescriptionImageUrl !== "string"
  ) {
    throw new ApiError(400, "prescriptionImageUrl must be a string or null");
  }

  if (notes !== undefined && notes !== null && typeof notes !== "string") {
    throw new ApiError(400, "Notes must be a string or null");
  }

  // -----------------------------------------
  // Create prescription
  // -----------------------------------------

  const prescription = await Prescription.create({
    userId: req.user.userId,

    name: name.trim(),

    prescriptionType,

    OD: {
      sph: OD.sph,
      cyl: OD.cyl,
      axis: OD.axis,
      add: OD.add !== undefined ? OD.add : 0,
    },

    OS: {
      sph: OS.sph,
      cyl: OS.cyl,
      axis: OS.axis,
      add: OS.add !== undefined ? OS.add : 0,
    },

    pd,

    hasPrism: hasPrism === true,

    prescriptionImageUrl: prescriptionImageUrl || null,

    notes: typeof notes === "string" ? notes.trim() : null,
  });

  return res.status(201).json({
    data: prescription,
    error: null,
  });
});

// =========================================
// GET ALL PRESCRIPTIONS
// =========================================

export const getPrescriptions = asyncHandler(async (req, res) => {
  const prescriptions = await Prescription.find({
    userId: req.user.userId,
  }).sort({
    createdAt: -1,
  });

  return res.status(200).json({
    data: prescriptions,
    error: null,
  });
});

// =========================================
// GET ONE PRESCRIPTION
// =========================================

export const getPrescriptionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // -----------------------------------------
  // Validate ID
  // -----------------------------------------

  validateObjectId(id, "prescription ID");

  // -----------------------------------------
  // Find prescription owned by user
  // -----------------------------------------

  const prescription = await Prescription.findOne({
    _id: id,
    userId: req.user.userId,
  });

  if (!prescription) {
    throw new ApiError(404, "Prescription not found");
  }

  return res.status(200).json({
    data: prescription,
    error: null,
  });
});

// =========================================
// UPDATE PRESCRIPTION
// =========================================

export const updatePrescription = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // -----------------------------------------
  // Validate ID
  // -----------------------------------------

  validateObjectId(id, "prescription ID");

  const updates = {};

  // -----------------------------------------
  // Prescription type
  // -----------------------------------------

  if (req.body.prescriptionType !== undefined) {
    validateEnum(
      req.body.prescriptionType,
      ["SINGLE_VISION", "PROGRESSIVE", "READING", "NON_PRESCRIPTION"],
      "prescription type",
    );

    updates.prescriptionType = req.body.prescriptionType;
  }

  // -----------------------------------------
  // Name
  // -----------------------------------------

  if (req.body.name !== undefined) {
    if (typeof req.body.name !== "string" || req.body.name.trim() === "") {
      throw new ApiError(400, "Prescription name cannot be empty");
    }

    updates.name = req.body.name.trim();
  }

  // -----------------------------------------
  // OD
  // -----------------------------------------

  if (req.body.OD !== undefined) {
    validateEye(req.body.OD, "OD");

    updates.OD = {
      sph: req.body.OD.sph,
      cyl: req.body.OD.cyl,
      axis: req.body.OD.axis,
      add: req.body.OD.add !== undefined ? req.body.OD.add : 0,
    };
  }

  // -----------------------------------------
  // OS
  // -----------------------------------------

  if (req.body.OS !== undefined) {
    validateEye(req.body.OS, "OS");

    updates.OS = {
      sph: req.body.OS.sph,
      cyl: req.body.OS.cyl,
      axis: req.body.OS.axis,
      add: req.body.OS.add !== undefined ? req.body.OS.add : 0,
    };
  }

  // -----------------------------------------
  // PD
  // -----------------------------------------

  if (req.body.pd !== undefined) {
    if (
      typeof req.body.pd !== "number" ||
      !Number.isFinite(req.body.pd) ||
      req.body.pd < 20 ||
      req.body.pd > 90
    ) {
      throw new ApiError(400, "Pupillary distance must be between 20 and 90");
    }

    updates.pd = req.body.pd;
  }

  // -----------------------------------------
  // Prism
  // -----------------------------------------

  if (req.body.hasPrism !== undefined) {
    if (typeof req.body.hasPrism !== "boolean") {
      throw new ApiError(400, "hasPrism must be a boolean");
    }

    updates.hasPrism = req.body.hasPrism;
  }

  // -----------------------------------------
  // Prescription image
  // -----------------------------------------

  if (req.body.prescriptionImageUrl !== undefined) {
    if (
      req.body.prescriptionImageUrl !== null &&
      typeof req.body.prescriptionImageUrl !== "string"
    ) {
      throw new ApiError(400, "prescriptionImageUrl must be a string or null");
    }

    updates.prescriptionImageUrl = req.body.prescriptionImageUrl || null;
  }

  // -----------------------------------------
  // Notes
  // -----------------------------------------

  if (req.body.notes !== undefined) {
    if (req.body.notes !== null && typeof req.body.notes !== "string") {
      throw new ApiError(400, "Notes must be a string or null");
    }

    updates.notes =
      typeof req.body.notes === "string" ? req.body.notes.trim() : null;
  }

  // -----------------------------------------
  // Prevent empty update
  // -----------------------------------------

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "At least one valid field is required");
  }

  // -----------------------------------------
  // Update prescription
  // -----------------------------------------

  const prescription = await Prescription.findOneAndUpdate(
    {
      _id: id,
      userId: req.user.userId,
    },
    updates,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!prescription) {
    throw new ApiError(404, "Prescription not found");
  }

  return res.status(200).json({
    data: prescription,
    error: null,
  });
});

// =========================================
// DELETE PRESCRIPTION
// =========================================

export const deletePrescription = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // -----------------------------------------
  // Validate ID
  // -----------------------------------------

  validateObjectId(id, "prescription ID");

  // -----------------------------------------
  // Delete only user's own prescription
  // -----------------------------------------

  const prescription = await Prescription.findOneAndDelete({
    _id: id,
    userId: req.user.userId,
  });

  if (!prescription) {
    throw new ApiError(404, "Prescription not found");
  }

  return res.status(200).json({
    data: {
      message: "Prescription deleted successfully",
    },
    error: null,
  });
});
