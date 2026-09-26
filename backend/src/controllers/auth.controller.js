import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import EmailVerification from "../models/EmailVerification.js";
import { sendVerificationEmail } from "../services/email.service.js";
import { requireFields } from "../utils/validation.js";
import { recordAuditLog } from "./auditLog.controller.js";

const VERIFICATION_TTL_MINUTES = 10;
const VERIFICATION_MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

const generateVerificationCode = () =>
  crypto.randomInt(0, 1000000).toString().padStart(6, "0");

const issueVerificationCode = async (user) => {
  const code = generateVerificationCode();
  const now = new Date();

  await EmailVerification.findOneAndUpdate(
    { email: user.email },
    {
      email: user.email,
      code,
      expiresAt: new Date(
        now.getTime() + VERIFICATION_TTL_MINUTES * 60 * 1000,
      ),
      attempts: 0,
      sentAt: now,
    },
    { upsert: true, setDefaultsOnInsert: true },
  );

  await sendVerificationEmail({
    to: user.email,
    firstName: user.firstName,
    code,
  });
};

const issueToken = (user) =>
  jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    },
  );

const buildAuthPayload = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  role: user.role,
});


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

    // Names may only contain letters, spaces and hyphens
    const nameRegex = /^[A-Za-z\s-]+$/;

    if (!nameRegex.test(firstName.trim()) || !nameRegex.test(lastName.trim())) {
      return res.status(400).json({
        data: null,
        error: {
          message: "First and last name may only contain letters.",
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
      emailVerified: false,
    });

    // Send the 6-digit verification code to the new account's email
    try {
      await issueVerificationCode(user);
    } catch (emailError) {
      console.error("Verification email error:", emailError.message);

      // Roll back so the user can retry registration with the same email
      await User.deleteOne({ _id: user._id });

      return res.status(502).json({
        data: null,
        error: {
          message:
            "We could not send the verification email. Please try again.",
        },
      });
    }

    return res.status(201).json({
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        requiresVerification: true,
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

    // Block accounts that still need their email verified
    if (!user.emailVerified) {
      const pendingVerification = await EmailVerification.findOne({
        email: normalizedEmail,
      });

      if (pendingVerification) {
        return res.status(403).json({
          data: null,
          error: {
            message:
              "Your email is not verified yet. Enter the 6-digit code we sent to your inbox.",
            requiresVerification: true,
            email: user.email,
          },
        });
      }

      // Account created before email verification existed: mark as verified
      user.emailVerified = true;
    }

    // Create JWT
    const token = issueToken(user);

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
        user: buildAuthPayload(user),
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

export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    requireFields(req.body, ["email", "code"]);

    if (typeof email !== "string" || typeof code !== "string") {
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

    const normalizedEmail = email.trim().toLowerCase();
    const submittedCode = code.trim();

    if (!/^\d{6}$/.test(submittedCode)) {
      return res.status(400).json({
        data: null,
        error: {
          message: "Enter the 6-digit code from your email.",
        },
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({
        data: null,
        error: {
          message: "We could not find an account for this email.",
        },
      });
    }

    if (user.emailVerified) {
      return res.status(200).json({
        data: {
          verified: true,
          token: issueToken(user),
          user: buildAuthPayload(user),
        },
        error: null,
      });
    }

    const record = await EmailVerification.findOne({
      email: normalizedEmail,
    });

    if (!record) {
      return res.status(400).json({
        data: null,
        error: {
          message: "No verification code found. Please request a new one.",
        },
      });
    }

    if (record.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({
        data: null,
        error: {
          message: "This code has expired. Please request a new one.",
        },
      });
    }

    if (record.attempts >= VERIFICATION_MAX_ATTEMPTS) {
      return res.status(429).json({
        data: null,
        error: {
          message:
            "Too many incorrect attempts. Please request a new code.",
        },
      });
    }

    if (record.code !== submittedCode) {
      record.attempts += 1;
      await record.save();

      return res.status(400).json({
        data: null,
        error: {
          message: "Incorrect verification code.",
          attemptsRemaining: Math.max(
            0,
            VERIFICATION_MAX_ATTEMPTS - record.attempts,
          ),
        },
      });
    }

    user.emailVerified = true;
    await user.save();

    await EmailVerification.deleteOne({ _id: record._id });

    return res.status(200).json({
      data: {
        verified: true,
        token: issueToken(user),
        user: buildAuthPayload(user),
      },
      error: null,
    });
  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
      data: null,
      error: {
        message: error.message || "Email verification failed",
      },
    });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    requireFields(req.body, ["email"]);

    if (typeof email !== "string") {
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

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    // Same response whether or not the account exists
    const genericResponse = {
      data: {
        message: "If this email needs verification, a new code has been sent.",
      },
      error: null,
    };

    if (!user || user.emailVerified) {
      return res.status(200).json(genericResponse);
    }

    const record = await EmailVerification.findOne({
      email: normalizedEmail,
    });

    if (record) {
      const elapsedSeconds = (Date.now() - record.sentAt.getTime()) / 1000;

      if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
        return res.status(429).json({
          data: null,
          error: {
            message: `Please wait ${Math.ceil(
              RESEND_COOLDOWN_SECONDS - elapsedSeconds,
            )} seconds before requesting a new code.`,
            retryAfterSeconds: Math.ceil(
              RESEND_COOLDOWN_SECONDS - elapsedSeconds,
            ),
          },
        });
      }
    }

    try {
      await issueVerificationCode(user);
    } catch (emailError) {
      console.error("Verification email error:", emailError.message);

      return res.status(502).json({
        data: null,
        error: {
          message:
            "We could not send the verification email. Please try again.",
        },
      });
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
      data: null,
      error: {
        message: error.message || "Could not resend the verification code",
      },
    });
  }
};
