import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
} from "../controllers/article.controller.js";

const router = Router();

// Public read endpoints
router.get("/", getArticles);
router.get("/:id", getArticleById);

// Admin-only management endpoints
router.post("/", authenticate, requireRole("ADMIN"), createArticle);

router.patch("/:id", authenticate, requireRole("ADMIN"), updateArticle);

router.delete("/:id", authenticate, requireRole("ADMIN"), deleteArticle);

export default router;
