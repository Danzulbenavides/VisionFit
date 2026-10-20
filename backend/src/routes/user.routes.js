import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
  changePassword,
  getCurrentUser,
  getAllUsers,
  setUserStatus,
} from "../controllers/user.controller.js";

const router = Router();

// =========================================
// CUSTOMER / AUTHENTICATED USER
// =========================================

router.get("/me", authenticate, getCurrentUser);

router.patch("/password", authenticate, changePassword);

// =========================================
// ADMIN ONLY
// =========================================

router.get("/admin", authenticate, requireRole("ADMIN"), getAllUsers);

router.patch(
  "/admin/:id/status",
  authenticate,
  requireRole("ADMIN"),
  setUserStatus,
);

export default router;
