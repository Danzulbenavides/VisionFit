import mongoose from "mongoose"; // SUSPEND

import User from "../models/User.js";
import { recordAuditLog } from "./auditLog.controller.js"; // SUSPEND

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.user.userId,
      isActive: true,
    }).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        data: null,
        error: {
          message: "User not found",
        },
      });
    }

    return res.status(200).json({
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      error: null,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      data: null,
      error: {
        message: "Failed to retrieve user",
      },
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-passwordHash").sort({
      createdAt: -1,
    });

    return res.status(200).json({
      data: users,
      error: null,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      data: null,
      error: {
        message: "Failed to retrieve users",
      },
    });
  }
};

// =========================================
// ADMIN: SUSPEND / REACTIVATE USER
// =========================================

// SUSPEND START
const setUserSuspension = (suspend) => async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        data: null,
        error: { message: "Invalid user ID" },
      });
    }

    // Admin cannot suspend their own account
    if (suspend && id === String(req.user.userId)) {
      return res.status(400).json({
        data: null,
        error: { message: "You cannot suspend your own account" },
      });
    }

    const user = await User.findById(id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        data: null,
        error: { message: "User not found" },
      });
    }

    // Admin accounts cannot be suspended
    if (suspend && user.role === "ADMIN") {
      return res.status(403).json({
        data: null,
        error: { message: "Administrator accounts cannot be suspended" },
      });
    }

    user.isActive = !suspend;
    await user.save();

    try {
      await recordAuditLog({
        adminId: req.user.userId,
        action: suspend ? "SUSPEND" : "REACTIVATE",
        resourceType: "USER",
        resourceId: user._id,
        details: `${suspend ? "Suspended" : "Reactivated"} user ${user.email}`,
      });
    } catch (auditError) {
      console.error("Audit log error:", auditError.message);
    }

    return res.status(200).json({
      data: user,
      error: null,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      data: null,
      error: { message: "Failed to update user status" },
    });
  }
};

export const suspendUser = setUserSuspension(true);

export const reactivateUser = setUserSuspension(false);
// SUSPEND END