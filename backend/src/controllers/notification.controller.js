import mongoose from "mongoose";

import Notification from "../models/Notification.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);

  const filter = { userId: req.user.userId };

  if (req.query.unreadOnly === "true") {
    filter.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.user.userId, isRead: false }),
  ]);

  return res.status(200).json({
    data: {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    error: null,
  });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    userId: req.user.userId,
    isRead: false,
  });

  return res.status(200).json({ data: { unreadCount }, error: null });
});

export const markAsRead = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(400, "Invalid notification ID");
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.userId },
    { isRead: true, readAt: new Date() },
    { new: true },
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return res.status(200).json({ data: notification, error: null });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.userId, isRead: false },
    { isRead: true, readAt: new Date() },
  );

  return res.status(200).json({ data: { success: true }, error: null });
});

export const registerPushToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (typeof token !== "string" || !token.trim()) {
    throw new ApiError(400, "Push token is required");
  }

  // A device token belongs to ONE account at a time
  await User.updateMany(
    { pushTokens: token.trim(), _id: { $ne: req.user.userId } },
    { $pull: { pushTokens: token.trim() } },
  );

  await User.updateOne(
    { _id: req.user.userId },
    { $addToSet: { pushTokens: token.trim() } },
  );

  return res.status(200).json({ data: { success: true }, error: null });
});

export const removePushToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (typeof token === "string" && token.trim()) {
    await User.updateOne(
      { _id: req.user.userId },
      { $pull: { pushTokens: token.trim() } },
    );
  }

  return res.status(200).json({ data: { success: true }, error: null });
});
