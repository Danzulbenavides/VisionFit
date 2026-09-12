import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";

import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";

const router = Router();

// Public product reviews
router.get("/products/:productId", getProductReviews);

// Authenticated customer actions
router.post("/products/:productId", authenticate, createReview);

router.patch("/:id", authenticate, updateReview);

router.delete("/:id", authenticate, deleteReview);

export default router;
