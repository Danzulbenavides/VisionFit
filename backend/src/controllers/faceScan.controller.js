import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

import { analyzeFaceImage } from "../services/aiService.js";

export const analyzeFaceScan = asyncHandler(async (req, res) => {
  console.log("========================================");
  console.log("FACE SCAN REQUEST RECEIVED");
  console.log("========================================");

  console.log("File exists:", Boolean(req.file));

  if (req.file) {
    console.log("Filename:", req.file.originalname);
    console.log("Mimetype:", req.file.mimetype);
    console.log("Size:", req.file.size);
    console.log("Buffer exists:", Buffer.isBuffer(req.file.buffer));
  }

  if (!req.file) {
    throw new ApiError(400, "Face scan image is required");
  }

  const allowedMimeTypes = ["image/jpeg", "image/jpg"];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    throw new ApiError(400, `Unsupported image type: ${req.file.mimetype}`);
  }

  try {
    console.log("Sending image to Python AI service...");

    const result = await analyzeFaceImage(
      req.file.buffer,
      req.file.originalname,
    );

    console.log("Python AI service response:", result);

    return res.status(200).json({
      data: result,
      error: null,
    });
  } catch (error) {
    console.error("========================================");
    console.error("PYTHON AI SERVICE FAILED");
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("========================================");

    throw error;
  }
});
