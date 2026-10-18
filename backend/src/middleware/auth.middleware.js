import jwt from "jsonwebtoken";

import mongoose from "mongoose";

import User from "../models/User.js";

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check whether Authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        data: null,
        error: {
          message: "Authentication required",
        },
      });
    }

    // Expected format:
    // Authorization: Bearer <token>
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        data: null,
        error: {
          message: "Invalid authorization format",
        },
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!mongoose.Types.ObjectId.isValid(decoded.userId)) {
      throw new Error("Invalid user id in token");
    }

    const account = await User.findById(decoded.userId)
      .select("isActive suspensionReason")
      .lean();

    if (!account) {
      throw new Error("Account no longer exists");
    }

    if (!account.isActive) {
      return res.status(403).json({
        data: null,
        error: {
            message: account.suspensionReason
            ? `Your account has been suspended (reason: ${account.suspensionReason}).`
            : "Your account has been suspended.",
          suspended: true,
        },
      });
    }

    // Attach authenticated user to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      data: null,
      error: {
        message: "Invalid or expired token",
      },
    });
  }
};

export default authenticate;
