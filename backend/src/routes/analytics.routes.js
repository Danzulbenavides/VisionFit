import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
  getAnalyticsSummary,
  getProductDataQuality,
} from "../controllers/analytics.controller.js";

const router = Router();

// Every analytics request requires authentication
router.use(authenticate);

// Analytics are ADMIN only
router.use(requireRole("ADMIN"));

router.get("/summary", getAnalyticsSummary);

router.get("/product-quality", getProductDataQuality);

export default router;
