import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
  getCurrentUser,
  getAllUsers,
  suspendUser, // SUSPEND
  reactivateUser, // SUSPEND
} from "../controllers/user.controller.js";

const router = Router();

// =========================================
// CUSTOMER / AUTHENTICATED USER
// =========================================

router.get("/me", authenticate, getCurrentUser);

// =========================================
// ADMIN ONLY
// =========================================

router.get("/admin", authenticate, requireRole("ADMIN"), getAllUsers);

// SUSPEND START
router.patch(
  "/admin/:id/suspend",
  authenticate,
  requireRole("ADMIN"),
  suspendUser,
);

router.patch(
  "/admin/:id/reactivate",
  authenticate,
  requireRole("ADMIN"),
  reactivateUser,
);
// SUSPEND END

export default router;