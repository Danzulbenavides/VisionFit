import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import { requireFields } from "../utils/validation.js";
import { recordAuditLog } from "./auditLog.controller.js";

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Basic required-field validation
    requireFields(req.body, [
      "firstName",
      "lastName",
      "email",
      "password",
      "phone",
    ]);

    // Validate input types
    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof phone !== "string"
    ) {
      return res.status(400).json({
        data: null,
        error: {
          message: "Invalid input types",
        },
      });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        data: null,
        error: {
          message: "Invalid email address",
        },
      });
    }

    // Normalize names
    const formatName = (value) =>
      value
        .trim()
        .toLowerCase()
        .replace(
          /(^|[\s-])([a-z])/g,
          (_, separator, letter) => `${separator}${letter.toUpperCase()}`,
        );

    const normalizedFirstName = formatName(firstName);
    const normalizedLastName = formatName(lastName);

    // Validate password strength
    const passwordRequirements =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!passwordRequirements) {
      return res.status(400).json({
        data: null,
        error: {
          message:
            "Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character.",
        },
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Normalize phone
    const normalizedPhone = phone.trim();

    // Validate phone number
    const phoneRegex = /^09\d{9}$/;

    if (!phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({
        data: null,
        error: {
          message:
            "Please enter a valid 11-digit Philippine mobile number starting with 09.",
        },
      });
    }

    // Check whether email already exists
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        data: null,
        error: {
          message: "An account with this email already exists",
        },
      });
    }

    // Check whether phone number already exists
    const existingPhone = await User.findOne({
      phone: normalizedPhone,
    });

    if (existingPhone) {
      return res.status(409).json({
        data: null,
        error: {
          message: "An account with this phone number already exists",
        },
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      email: normalizedEmail,
      passwordHash,
      phone: normalizedPhone,
    });

    return res.status(201).json({
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      error: null,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({
      data: null,
      error: {
        message: error.message || "Failed to register user",
      },
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    requireFields(req.body, ["email", "password"]);

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        data: null,
        error: {
          message: "Invalid input types",
        },
      });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        data: null,
        error: {
          message: "Invalid email address",
        },
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Find active user
    const user = await User.findOne({
      email: normalizedEmail,
      isActive: true,
    });

    // Use a generic error message
    if (!user) {
      return res.status(401).json({
        data: null,
        error: {
          message: "Invalid email or password",
        },
      });
    }

    // Compare plaintext password with stored hash
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        data: null,
        error: {
          message: "Invalid email or password",
        },
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Record admin login in audit log
    if (user.role === "ADMIN") {
      try {
        await recordAuditLog({
          adminId: user._id,
          action: "LOGIN",
          resourceType: "AUTH",
          resourceId: user._id,
          details: "Administrator logged in successfully.",
        });
      } catch (auditError) {
        console.error("Audit log error:", auditError.message);
      }
    }

    return res.status(200).json({
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
      error: null,
    });
  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
      data: null,
      error: {
        message: error.message || "Login failed",
      },
    });
  }
};
