import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
  getAnalyticsSummary,
  getAnalyticsTrends,
  getProductDataQuality,
} from "../controllers/analytics.controller.js";

const router = Router();

// Every analytics request requires authentication
router.use(authenticate);

// Analytics summary is accessible to ADMIN and STAFF
router.get("/summary", requireRole("ADMIN", "STAFF"), getAnalyticsSummary);

// Analytics trends (last 30 days) is accessible to ADMIN and STAFF
router.get("/trends", requireRole("ADMIN", "STAFF"), getAnalyticsTrends);

// Product quality is ADMIN only
router.get("/product-quality", requireRole("ADMIN"), getProductDataQuality);

export default router;
