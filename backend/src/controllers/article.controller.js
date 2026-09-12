import mongoose from "mongoose";

import Article from "../models/Article.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// =========================================
// GET ALL PUBLISHED ARTICLES
// =========================================

export const getArticles = asyncHandler(async (req, res) => {
  const articles = await Article.find({
    isPublished: true,
  })
    .populate("authorId", "firstName lastName role")
    .sort({
      createdAt: -1,
    });

  return res.status(200).json({
    data: articles,
    error: null,
  });
});

// =========================================
// GET ONE PUBLISHED ARTICLE
// =========================================

export const getArticleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid article ID");
  }

  const article = await Article.findOne({
    _id: id,
    isPublished: true,
  }).populate("authorId", "firstName lastName role");

  if (!article) {
    throw new ApiError(404, "Article not found");
  }

  return res.status(200).json({
    data: article,
    error: null,
  });
});

// =========================================
// CREATE ARTICLE
// ADMIN ONLY
// =========================================

export const createArticle = asyncHandler(async (req, res) => {
  const {
    title,
    slug,
    category,
    summary,
    content,
    imageUrl,
    isPublished = false,
  } = req.body;

  if (!title || !slug || !category || !summary || !content) {
    throw new ApiError(
      400,
      "Title, slug, category, summary, and content are required",
    );
  }

  const allowedCategories = [
    "PRESCRIPTIONS",
    "EYE_CARE",
    "FRAME_GUIDE",
    "LENS_GUIDE",
    "FACE_SHAPE",
  ];

  if (!allowedCategories.includes(category)) {
    throw new ApiError(400, "Invalid article category");
  }

  if (typeof isPublished !== "boolean") {
    throw new ApiError(400, "isPublished must be a boolean");
  }

  const article = await Article.create({
    title: title.trim(),

    slug: slug.trim().toLowerCase(),

    category,

    summary: summary.trim(),

    content,

    imageUrl: imageUrl || null,

    authorId: req.user.userId,

    isPublished,
  });

  return res.status(201).json({
    data: article,
    error: null,
  });
});

// =========================================
// UPDATE ARTICLE
// ADMIN ONLY
// =========================================

export const updateArticle = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid article ID");
  }

  const allowedCategories = [
    "PRESCRIPTIONS",
    "EYE_CARE",
    "FRAME_GUIDE",
    "LENS_GUIDE",
    "FACE_SHAPE",
  ];

  const allowedFields = [
    "title",
    "slug",
    "category",
    "summary",
    "content",
    "imageUrl",
    "isPublished",
  ];

  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  // -----------------------------------------
  // Validate values
  // -----------------------------------------

  if (updates.title !== undefined) {
    if (typeof updates.title !== "string" || updates.title.trim() === "") {
      throw new ApiError(400, "Article title cannot be empty");
    }

    updates.title = updates.title.trim();
  }

  if (updates.slug !== undefined) {
    if (typeof updates.slug !== "string" || updates.slug.trim() === "") {
      throw new ApiError(400, "Article slug cannot be empty");
    }

    updates.slug = updates.slug.trim().toLowerCase();
  }

  if (
    updates.category !== undefined &&
    !allowedCategories.includes(updates.category)
  ) {
    throw new ApiError(400, "Invalid article category");
  }

  if (updates.summary !== undefined) {
    if (typeof updates.summary !== "string" || updates.summary.trim() === "") {
      throw new ApiError(400, "Article summary cannot be empty");
    }

    updates.summary = updates.summary.trim();
  }

  if (
    updates.isPublished !== undefined &&
    typeof updates.isPublished !== "boolean"
  ) {
    throw new ApiError(400, "isPublished must be a boolean");
  }

  const article = await Article.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!article) {
    throw new ApiError(404, "Article not found");
  }

  return res.status(200).json({
    data: article,
    error: null,
  });
});

// =========================================
// DELETE ARTICLE
// ADMIN ONLY
// =========================================

export const deleteArticle = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid article ID");
  }

  const article = await Article.findByIdAndDelete(id);

  if (!article) {
    throw new ApiError(404, "Article not found");
  }

  return res.status(200).json({
    data: {
      message: "Article deleted successfully",
    },
    error: null,
  });
});
