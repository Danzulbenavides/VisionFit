import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
  createOrder,
  getOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controller.js";

const router = Router();

// =========================================
// ALL ORDER ROUTES REQUIRE AUTHENTICATION
// =========================================

router.use(authenticate);

// =========================================
// CUSTOMER ROUTES
// =========================================

router.post("/", createOrder);

router.get("/", getOrders);

// =========================================
// ADMIN ROUTES
// IMPORTANT:
// /admin MUST COME BEFORE /:id
// =========================================

router.get("/admin", requireRole("ADMIN"), getAllOrders);

router.patch("/:id/status", requireRole("ADMIN"), updateOrderStatus);

// =========================================
// CUSTOMER ORDER DETAILS
// =========================================

router.get("/:id", getOrderById);

export default router;
