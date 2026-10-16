import jwt from "jsonwebtoken";

import User from "../models/User.js"; // SUSPEND

const authenticate = async (req, res, next) => { // SUSPEND: added async
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

    // SUSPEND START
    // Reject suspended or deleted accounts even if their token is still valid
    const account = await User.findById(decoded.userId).select("isActive");

    if (!account || !account.isActive) {
      return res.status(403).json({
        data: null,
        error: {
          message: "Your account has been suspended. Please contact support.",
        },
      });
    }

    // SUSPEND END

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