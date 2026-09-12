import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

const router = Router();

// Public catalog
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin-only product management
router.post("/", authenticate, requireRole("ADMIN"), createProduct);

router.patch("/:id", authenticate, requireRole("ADMIN"), updateProduct);

router.delete("/:id", authenticate, requireRole("ADMIN"), deleteProduct);

export default router;
