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

// Admin + Staff: create, edit and delete products
router.post("/", authenticate, requireRole("ADMIN", "STAFF"), createProduct);

router.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN", "STAFF"),
  updateProduct,
);

router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN", "STAFF"),
  deleteProduct,
);

export default router;