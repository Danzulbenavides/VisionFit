import mongoose from "mongoose";

import UserEvent from "../models/UserEvent.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// =========================================
// CREATE USER EVENT
// =========================================

export const createUserEvent = asyncHandler(async (req, res) => {
  const {
    eventType,
    productId = null,
    orderId = null,
    metadata = {},
  } = req.body;

  // -----------------------------------------
  // 1. Validate event type
  // -----------------------------------------

  const allowedEventTypes = [
    "PRODUCT_VIEW",
    "ADD_TO_CART",
    "REMOVE_FROM_CART",
    "FAVORITE",
    "UNFAVORITE",
    "FACE_SCAN",
    "RECOMMENDATION_FEEDBACK",
    "CHECKOUT_STARTED",
    "ORDER_COMPLETED",
  ];

  if (!allowedEventTypes.includes(eventType)) {
    throw new ApiError(400, "Invalid event type");
  }

  // -----------------------------------------
  // 2. Validate product ID
  // -----------------------------------------

  if (productId !== null && !mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  // -----------------------------------------
  // 3. Validate order ID
  // -----------------------------------------

  if (orderId !== null && !mongoose.Types.ObjectId.isValid(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  // -----------------------------------------
  // 4. Verify product
  // -----------------------------------------

  if (productId !== null) {
    const product = await Product.findById(productId);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }
  }

  // -----------------------------------------
  // 5. Verify order ownership
  // -----------------------------------------

  if (orderId !== null) {
    const order = await Order.findOne({
      _id: orderId,
      userId: req.user.userId,
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }
  }

  // -----------------------------------------
  // 6. Validate metadata
  // -----------------------------------------

  if (
    metadata === null ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    throw new ApiError(400, "Metadata must be an object");
  }

  // -----------------------------------------
  // 7. Create event
  // -----------------------------------------

  const event = await UserEvent.create({
    userId: req.user.userId,
    eventType,
    productId,
    orderId,
    metadata,
  });

  return res.status(201).json({
    data: event,
    error: null,
  });
});
