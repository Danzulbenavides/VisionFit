import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import { getAuditLogs } from "../controllers/auditLog.controller.js";

const router = Router();

// Every audit-log request requires authentication
router.use(authenticate);

// Audit logs are ADMIN only
router.use(requireRole("ADMIN"));

router.get("/", getAuditLogs);

export default router;
