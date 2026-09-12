import mongoose from "mongoose";

import Favorite from "../models/Favorite.js";
import Product from "../models/Product.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// =========================================
// ADD FAVORITE
// =========================================

export const addFavorite = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // Validate product ID
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  // Verify product exists and is active
  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Prevent duplicate favorite
  const existingFavorite = await Favorite.findOne({
    userId: req.user.userId,
    productId,
  });

  if (existingFavorite) {
    throw new ApiError(409, "Product is already in favorites");
  }

  const favorite = await Favorite.create({
    userId: req.user.userId,
    productId,
  });

  const populatedFavorite = await Favorite.findById(favorite._id).populate(
    "productId",
  );

  return res.status(201).json({
    data: populatedFavorite,
    error: null,
  });
});

// =========================================
// GET ALL FAVORITES
// =========================================

export const getFavorites = asyncHandler(async (req, res) => {
  const favorites = await Favorite.find({
    userId: req.user.userId,
  })
    .populate("productId")
    .sort({
      createdAt: -1,
    });

  return res.status(200).json({
    data: favorites,
    error: null,
  });
});

// =========================================
// GET FAVORITE BY PRODUCT
// =========================================

export const getFavoriteByProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const favorite = await Favorite.findOne({
    userId: req.user.userId,
    productId,
  }).populate("productId");

  if (!favorite) {
    throw new ApiError(404, "Favorite not found");
  }

  return res.status(200).json({
    data: favorite,
    error: null,
  });
});

// =========================================
// REMOVE FAVORITE
// =========================================

export const removeFavorite = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const favorite = await Favorite.findOneAndDelete({
    userId: req.user.userId,
    productId,
  });

  if (!favorite) {
    throw new ApiError(404, "Favorite not found");
  }

  return res.status(200).json({
    data: {
      message: "Favorite removed successfully",
    },
    error: null,
  });
});
