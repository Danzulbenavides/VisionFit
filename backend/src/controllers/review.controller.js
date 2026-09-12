import mongoose from "mongoose";

import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// =========================================
// CREATE REVIEW
// =========================================

export const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const { rating, title, comment } = req.body;

  // -----------------------------------------
  // 1. Validate product ID
  // -----------------------------------------

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  // -----------------------------------------
  // 2. Validate required fields
  // -----------------------------------------

  if (rating === undefined || !title || !comment) {
    throw new ApiError(400, "Rating, title, and comment are required");
  }

  // -----------------------------------------
  // 3. Validate rating
  // -----------------------------------------

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be an integer between 1 and 5");
  }

  // -----------------------------------------
  // 4. Verify product
  // -----------------------------------------

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // -----------------------------------------
  // 5. Prevent duplicate review
  // -----------------------------------------

  const existingReview = await Review.findOne({
    userId: req.user.userId,
    productId,
  });

  if (existingReview) {
    throw new ApiError(409, "You have already reviewed this product");
  }

  // -----------------------------------------
  // 6. Purchase verification
  // -----------------------------------------

  const deliveredOrder = await Order.findOne({
    userId: req.user.userId,
    orderStatus: "DELIVERED",
    "items.productId": productId,
  }).sort({
    createdAt: -1,
  });

  if (!deliveredOrder) {
    throw new ApiError(
      403,
      "You can only review products you have purchased and received",
    );
  }

  // -----------------------------------------
  // 7. Create review
  // -----------------------------------------

  const review = await Review.create({
    userId: req.user.userId,
    productId: product._id,
    orderId: deliveredOrder._id,
    rating,
    title: title.trim(),
    comment: comment.trim(),
  });

  // -----------------------------------------
  // 8. Populate response
  // -----------------------------------------

  const populatedReview = await Review.findById(review._id)
    .populate("userId", "firstName lastName")
    .populate("productId", "name brand price images");

  return res.status(201).json({
    data: populatedReview,
    error: null,
  });
});

// =========================================
// GET PRODUCT REVIEWS
// =========================================

export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // Validate product ID
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  // Verify product exists
  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const reviews = await Review.find({
    productId,
    isPublished: true,
  })
    .populate("userId", "firstName lastName")
    .sort({
      createdAt: -1,
    });

  const reviewCount = reviews.length;

  const averageRating =
    reviewCount === 0
      ? 0
      : Number(
          (
            reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviewCount
          ).toFixed(2),
        );

  return res.status(200).json({
    data: {
      productId,
      reviewCount,
      averageRating,
      reviews,
    },
    error: null,
  });
});

// =========================================
// UPDATE REVIEW
// =========================================

export const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rating, title, comment } = req.body;

  // Validate review ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid review ID");
  }

  // Validate rating
  if (
    rating !== undefined &&
    (!Number.isInteger(rating) || rating < 1 || rating > 5)
  ) {
    throw new ApiError(400, "Rating must be an integer between 1 and 5");
  }

  const updates = {};

  if (rating !== undefined) {
    updates.rating = rating;
  }

  if (title !== undefined) {
    updates.title = title.trim();
  }

  if (comment !== undefined) {
    updates.comment = comment.trim();
  }

  const review = await Review.findOneAndUpdate(
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

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  return res.status(200).json({
    data: review,
    error: null,
  });
});

// =========================================
// DELETE REVIEW
// =========================================

export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate review ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid review ID");
  }

  const review = await Review.findOneAndDelete({
    _id: id,
    userId: req.user.userId,
  });

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  return res.status(200).json({
    data: {
      message: "Review deleted successfully",
    },
    error: null,
  });
});
