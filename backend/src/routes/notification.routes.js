import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";

import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  registerPushToken,
  removePushToken,
} from "../controllers/notification.controller.js";

const router = Router();

// Every role (CUSTOMER, STAFF, ADMIN) reads ONLY their own notifications
router.use(authenticate);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);

// Static paths MUST come before /:id
router.patch("/read-all", markAllAsRead);
router.post("/push-token", registerPushToken);
router.delete("/push-token", removePushToken);

router.patch("/:id/read", markAsRead);

export default router;
