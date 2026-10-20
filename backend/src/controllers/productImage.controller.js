import crypto from "node:crypto";
import axios from "axios";
import FormData from "form-data";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const uploadProductImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Choose a product image to upload.");
  }

  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowedTypes.has(req.file.mimetype)) {
    throw new ApiError(400, "Only JPG, PNG, and WebP images are supported.");
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new ApiError(
      503,
      "Image upload is not configured. Set the Cloudinary environment variables on the backend.",
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "visionfit/products";
  const signatureBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto
    .createHash("sha1")
    .update(signatureBase)
    .digest("hex");

  const form = new FormData();
  form.append("file", req.file.buffer, {
    filename: req.file.originalname || "product-image",
    contentType: req.file.mimetype,
  });
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 30000,
        maxBodyLength: 6 * 1024 * 1024,
        maxContentLength: 6 * 1024 * 1024,
      },
    );

    return res.status(201).json({
      data: {
        url: response.data.secure_url,
        publicId: response.data.public_id,
      },
      error: null,
    });
  } catch (error) {
    // Do not return the provider response or any request secrets to the client.
    console.error(
      "Product image upload failed:",
      error.response?.status || error.message,
    );
    throw new ApiError(
      502,
      "The image could not be uploaded. Please try again.",
    );
  }
});
