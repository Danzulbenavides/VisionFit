import mongoose from "mongoose";

import User from "../models/User.js";
import { recordAuditLog } from "./auditLog.controller.js";

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

export const setUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        data: null,
        error: { message: "Invalid user ID" },
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        data: null,
        error: { message: "isActive must be true or false" },
      });
    }

    if (String(id) === String(req.user.userId)) {
      return res.status(400).json({
        data: null,
        error: { message: "You cannot suspend your own account." },
      });
    }

    const user = await User.findById(id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        data: null,
        error: { message: "User not found" },
      });
    }

    if (user.role === "ADMIN" && !isActive) {
      return res.status(403).json({
        data: null,
        error: { message: "Administrator accounts cannot be suspended." },
      });
    }

    const cleanReason =
      typeof reason === "string" && reason.trim()
        ? reason.trim().slice(0, 200)
        : null;

    let updatedUser = user;

    if (user.isActive !== isActive) {
      updatedUser = await User.findByIdAndUpdate(
        id,
                {
          $set: {
            isActive,
            suspensionReason: isActive ? null : cleanReason,
          },
        },
        { new: true },
      ).select("-passwordHash");

      try {
        await recordAuditLog({
          adminId: req.user.userId,
          action: isActive ? "REACTIVATE" : "SUSPEND",
          resourceType: "USER",
          resourceId: user._id,
          details: `${isActive ? "Reactivated" : "Suspended"} account ${user.email}${
            cleanReason ? ` (reason: ${cleanReason})` : ""
          }.`,
        });
      } catch (auditError) {
        console.error("Audit log error:", auditError.message);
      }
    }

    return res.status(200).json({
      data: updatedUser,
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