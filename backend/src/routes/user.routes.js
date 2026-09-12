import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import { getCurrentUser, getAllUsers } from "../controllers/user.controller.js";

const router = Router();

// =========================================
// CUSTOMER / AUTHENTICATED USER
// =========================================

router.get("/me", authenticate, getCurrentUser);

// =========================================
// ADMIN ONLY
// =========================================

router.get("/admin", authenticate, requireRole("ADMIN"), getAllUsers);

export default router;
