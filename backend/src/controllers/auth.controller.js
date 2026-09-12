import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

import { requireFields } from "../utils/validation.js";

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Basic required-field validation
    requireFields(req.body, ["firstName", "lastName", "email", "password"]);

    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        data: null,
        error: {
          message: "Invalid input types",
        },
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        data: null,
        error: {
          message: "Invalid email address",
        },
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        data: null,
        error: {
          message: "Password must be at least 8 characters",
        },
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check whether account already exists
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

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      passwordHash,
      phone,
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

    return res.status(500).json({
      data: null,
      error: {
        message: "Failed to register user",
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

    return res.status(500).json({
      data: null,
      error: {
        message: "Login failed",
      },
    });
  }
};
