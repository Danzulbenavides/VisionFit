import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import EmailVerification from "../models/EmailVerification.js";
import PasswordReset from "../models/PasswordReset.js";
import PinReset from "../models/PinReset.js";
import LoginThrottle from "../models/LoginThrottle.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPinResetEmail,
} from "../services/email.service.js";
import { requireFields } from "../utils/validation.js";
import { recordAuditLog } from "./auditLog.controller.js";

const VERIFICATION_TTL_MINUTES = 10;
const VERIFICATION_MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

// The admin/staff web apps split login into two steps: password first, then a
// static 6-digit PIN. The challenge JWT bridges the two steps and is useless
// for anything except calling verifyPin.
const PIN_CHALLENGE_TTL_SECONDS = 5 * 60;

// Only these emails may use the admin/staff "Forgot PIN" flow. Override with
// FORGOT_PIN_ALLOWED_EMAILS (comma-separated) in the backend .env file.
const DEFAULT_FORGOT_PIN_ALLOWED_EMAILS = [
  "randallbenedict14@gmail.com",
  "danzulbenavides@gmail.com",
  "mark011623@gmail.com",
];

const forgotPinAllowedEmails = () => {
  const raw =
    process.env.FORGOT_PIN_ALLOWED_EMAILS ||
    DEFAULT_FORGOT_PIN_ALLOWED_EMAILS.join(",");

  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
};

// Login lockout: after this many wrong attempts the account is suspended,
// for 5 minutes on the 1st lockout, 15 minutes on the 2nd and 30 minutes
// from the 3rd onwards. A successful login clears the counter and strikes.
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = [5, 15, 30];

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

const issuePasswordResetCode = async (user) => {
  const code = generateVerificationCode();
  const now = new Date();

  await PasswordReset.findOneAndUpdate(
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

  await sendPasswordResetEmail({
    to: user.email,
    firstName: user.firstName,
    code,
  });
};

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const isStrongPassword = (password) =>
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

const lockMinutesForStrike = (strike) =>
  LOGIN_LOCK_MINUTES[
    Math.min(Math.max(strike, 1), LOGIN_LOCK_MINUTES.length) - 1
  ];

const minutesText = (minutes) =>
  `${minutes} minute${minutes === 1 ? "" : "s"}`;

const respondLocked = (res, minutes, secondsLeft) => {
  const retryAfterSeconds = Math.max(1, Math.ceil(secondsLeft));

  const waitText =
    retryAfterSeconds >= 60
      ? `${Math.ceil(retryAfterSeconds / 60)} minute(s)`
      : `${retryAfterSeconds} second(s)`;

  return res.status(423).json({
    data: null,
    error: {
      message: `Too many failed login attempts. Your account is temporarily locked for ${minutesText(
        minutes,
      )}. Try again in ${waitText}.`,
      retryAfterSeconds,
      lockedForMinutes: minutes,
    },
  });
};

// Counts one wrong attempt for an email address. Returns whether the account
// just got locked and, if not, how many attempts are left.
const registerFailedLogin = async (normalizedEmail) => {
  const throttle = await LoginThrottle.findOneAndUpdate(
    { email: normalizedEmail },
    { $inc: { failedAttempts: 1 } },
    { new: true, upsert: true },
  );

  if (throttle.failedAttempts < LOGIN_MAX_ATTEMPTS) {
    return {
      locked: false,
      attemptsRemaining: LOGIN_MAX_ATTEMPTS - throttle.failedAttempts,
    };
  }

  const strikes = (throttle.strikes || 0) + 1;
  const minutes = lockMinutesForStrike(strikes);
  const lockedUntil = new Date(Date.now() + minutes * 60 * 1000);

  await LoginThrottle.updateOne(
    { _id: throttle._id },
    {
      $set: {
        strikes,
        lockedUntil,
        failedAttempts: 0,
      },
    },
  );

  return {
    locked: true,
    minutes,
    lockedUntil,
    strikes,
  };
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

const issuePinChallenge = (user) =>
  jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      purpose: "pin",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: `${PIN_CHALLENGE_TTL_SECONDS}s`,
    },
  );

const issuePinResetCode = async (user, recoveryEmail) => {
  const code = generateVerificationCode();
  const now = new Date();

  await PinReset.findOneAndUpdate(
    { email: user.email },
    {
      email: user.email,
      code,
      recoveryEmail,
      expiresAt: new Date(
        now.getTime() + VERIFICATION_TTL_MINUTES * 60 * 1000,
      ),
      attempts: 0,
      sentAt: now,
    },
    { upsert: true, setDefaultsOnInsert: true },
  );

  await sendPinResetEmail({
    to: recoveryEmail,
    firstName: user.firstName,
    code,
    accountEmail: user.email,
  });

  // Restart the resend cooldown from when the email actually went out, so a
  // slow SMTP send does not silently burn the user's 60-second wait.
  await PinReset.updateOne(
    { email: user.email },
    { $set: { sentAt: new Date() } },
  );
};

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

    // Account lockout: refuse to even check credentials while suspended
    const throttle = await LoginThrottle.findOne({
      email: normalizedEmail,
    });

    if (throttle?.lockedUntil && throttle.lockedUntil.getTime() > Date.now()) {
      const minutes = lockMinutesForStrike(throttle.strikes || 1);

      return respondLocked(
        res,
        minutes,
        (throttle.lockedUntil.getTime() - Date.now()) / 1000,
      );
    }

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Use a generic error message
    if (!user) {
      const failure = await registerFailedLogin(normalizedEmail);

      if (failure.locked) {
        return respondLocked(
          res,
          failure.minutes,
          (failure.lockedUntil.getTime() - Date.now()) / 1000,
        );
      }

      return res.status(401).json({
        data: null,
        error: {
          message: `Invalid email or password. ${failure.attemptsRemaining} attempt${
            failure.attemptsRemaining === 1 ? "" : "s"
          } remaining before your account is temporarily locked.`,
          attemptsRemaining: failure.attemptsRemaining,
        },
      });
    }

    // Compare plaintext password with stored hash
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      const failure = await registerFailedLogin(normalizedEmail);

      if (failure.locked) {
        return respondLocked(
          res,
          failure.minutes,
          (failure.lockedUntil.getTime() - Date.now()) / 1000,
        );
      }

      return res.status(401).json({
        data: null,
        error: {
          message: `Invalid email or password. ${failure.attemptsRemaining} attempt${
            failure.attemptsRemaining === 1 ? "" : "s"
          } remaining before your account is temporarily locked.`,
          attemptsRemaining: failure.attemptsRemaining,
        },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        data: null,
        error: {
          message: user.suspensionReason
            ? `Your account has been suspended (reason: ${user.suspensionReason}).`
            : "Your account has been suspended.",
          suspended: true,
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

    // Admin and staff accounts must still pass the 6-digit PIN step in the
    // admin/staff web apps. Hand back a short-lived challenge instead of a
    // session token; the throttle, lastLoginAt and audit log are only
    // finalized once the PIN is confirmed.
    if (user.role === "ADMIN" || user.role === "STAFF") {
      return res.status(200).json({
        data: {
          requiresPin: true,
          challenge: issuePinChallenge(user),
          user: buildAuthPayload(user),
        },
        error: null,
      });
    }

    // Correct credentials and no blocking checks: clear failed attempts and
    // the strike level so the next lockout starts at 5 minutes again
    await LoginThrottle.deleteOne({ email: normalizedEmail });

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

export const verifyPin = async (req, res) => {
  try {
    const { challenge, pin } = req.body;

    requireFields(req.body, ["challenge", "pin"]);

    if (typeof challenge !== "string" || typeof pin !== "string") {
      return res.status(400).json({
        data: null,
        error: {
          message: "Invalid input types",
        },
      });
    }

    let payload;

    try {
      payload = jwt.verify(challenge, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        data: null,
        error: {
          message:
            "This sign-in attempt expired. Please enter your password again.",
        },
      });
    }

    if (payload.purpose !== "pin" || !payload.userId) {
      return res.status(401).json({
        data: null,
        error: {
          message:
            "This sign-in attempt expired. Please enter your password again.",
        },
      });
    }

    const submittedPin = pin.trim();

    if (!/^\d{6}$/.test(submittedPin)) {
      return res.status(400).json({
        data: null,
        error: {
          message: "Enter your 6-digit PIN.",
        },
      });
    }

    const user = await User.findById(payload.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        data: null,
        error: {
          message:
            "This sign-in attempt expired. Please enter your password again.",
        },
      });
    }

    const normalizedEmail = user.email;

    // Same account lockout as the password step
    const throttle = await LoginThrottle.findOne({
      email: normalizedEmail,
    });

    if (throttle?.lockedUntil && throttle.lockedUntil.getTime() > Date.now()) {
      const minutes = lockMinutesForStrike(throttle.strikes || 1);

      return respondLocked(
        res,
        minutes,
        (throttle.lockedUntil.getTime() - Date.now()) / 1000,
      );
    }

    if (!user.pinHash) {
      return res.status(403).json({
        data: null,
        error: {
          message:
            "No PIN has been set for this account. Use Forgot PIN or ask an administrator.",
        },
      });
    }

    const pinMatches = await bcrypt.compare(submittedPin, user.pinHash);

    if (!pinMatches) {
      const failure = await registerFailedLogin(normalizedEmail);

      if (failure.locked) {
        return respondLocked(
          res,
          failure.minutes,
          (failure.lockedUntil.getTime() - Date.now()) / 1000,
        );
      }

      return res.status(401).json({
        data: null,
        error: {
          message: `Incorrect PIN. ${failure.attemptsRemaining} attempt${
            failure.attemptsRemaining === 1 ? "" : "s"
          } remaining before your account is temporarily locked.`,
          attemptsRemaining: failure.attemptsRemaining,
        },
      });
    }

    // PIN confirmed: the sign-in is complete
    await LoginThrottle.deleteOne({ email: normalizedEmail });

    const token = issueToken(user);

    user.lastLoginAt = new Date();
    await user.save();

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
        message: error.message || "PIN verification failed",
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

export const forgotPassword = async (req, res) => {
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

    if (!isValidEmail(email)) {
      return res.status(400).json({
        data: null,
        error: {
          message: "Invalid email address",
        },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
      isActive: true,
    });

    if (!user) {
      return res.status(404).json({
        data: null,
        error: {
          message: "No VisionFit account exists for this email.",
        },
      });
    }

    const record = await PasswordReset.findOne({
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
      await issuePasswordResetCode(user);
    } catch (emailError) {
      console.error("Password reset email error:", emailError.message);

      return res.status(502).json({
        data: null,
        error: {
          message:
            "We could not send the reset email. Please try again.",
        },
      });
    }

    return res.status(200).json({
      data: {
        message: `A 6-digit reset code was sent to ${normalizedEmail}.`,
        email: normalizedEmail,
      },
      error: null,
    });
  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
      data: null,
      error: {
        message: error.message || "Could not start the password reset",
      },
    });
  }
};

export const verifyResetCode = async (req, res) => {
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

    if (!isValidEmail(email)) {
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

    const user = await User.findOne({
      email: normalizedEmail,
      isActive: true,
    });

    if (!user) {
      return res.status(404).json({
        data: null,
        error: {
          message: "No VisionFit account exists for this email.",
        },
      });
    }

    const record = await PasswordReset.findOne({
      email: normalizedEmail,
    });

    if (!record) {
      return res.status(400).json({
        data: null,
        error: {
          message: "No reset code found. Please request a new one.",
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
          message: "Incorrect reset code.",
          attemptsRemaining: Math.max(
            0,
            VERIFICATION_MAX_ATTEMPTS - record.attempts,
          ),
        },
      });
    }

    return res.status(200).json({
      data: {
        verified: true,
        email: normalizedEmail,
      },
      error: null,
    });
  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
      data: null,
      error: {
        message: error.message || "Code verification failed",
      },
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, code, password } = req.body;

    requireFields(req.body, ["email", "code", "password"]);

    if (
      typeof email !== "string" ||
      typeof code !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        data: null,
        error: {
          message: "Invalid input types",
        },
      });
    }

    if (!isValidEmail(email)) {
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

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        data: null,
        error: {
          message:
            "Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character.",
        },
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
      isActive: true,
    });

    if (!user) {
      return res.status(404).json({
        data: null,
        error: {
          message: "No VisionFit account exists for this email.",
        },
      });
    }

    const record = await PasswordReset.findOne({
      email: normalizedEmail,
    });

    if (!record) {
      return res.status(400).json({
        data: null,
        error: {
          message: "No reset code found. Please request a new one.",
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
          message: "Incorrect reset code.",
          attemptsRemaining: Math.max(
            0,
            VERIFICATION_MAX_ATTEMPTS - record.attempts,
          ),
        },
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    user.passwordHash = passwordHash;
    await user.save();

    await PasswordReset.deleteOne({ _id: record._id });

    return res.status(200).json({
      data: {
        reset: true,
        email: normalizedEmail,
      },
      error: null,
    });
  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
      data: null,
      error: {
        message: error.message || "Password reset failed",
      },
    });
  }
};

// Validates the recovery mailbox that receives the reset code. Only the
// addresses in FORGOT_PIN_ALLOWED_EMAILS are authorized - this is the sole
// gate that decides who may use PIN recovery at all.
const validateRecoveryEmail = (res, recoveryEmail) => {
  if (typeof recoveryEmail !== "string") {
    res.status(400).json({
      data: null,
      error: {
        message: "Invalid input types",
      },
    });
    return null;
  }

  if (!isValidEmail(recoveryEmail)) {
    res.status(400).json({
      data: null,
      error: {
        message: "Invalid email address",
      },
    });
    return null;
  }

  const normalizedRecoveryEmail = recoveryEmail.trim().toLowerCase();

  if (!forgotPinAllowedEmails().includes(normalizedRecoveryEmail)) {
    res.status(403).json({
      data: null,
      error: {
        message: "This email is not authorized for PIN recovery.",
      },
    });
    return null;
  }

  return normalizedRecoveryEmail;
};

// Validates the account whose PIN is being reset. It must exist, be active
// and be one of the web roles (ADMIN/STAFF). Returns { normalizedEmail, user }
// or null after sending the error response.
const findPinResetAccount = async (res, email) => {
  if (typeof email !== "string") {
    res.status(400).json({
      data: null,
      error: {
        message: "Invalid input types",
      },
    });
    return null;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({
      data: null,
      error: {
        message: "Invalid email address",
      },
    });
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !user.isActive) {
    res.status(404).json({
      data: null,
      error: {
        message: "No admin or staff account exists for this email.",
      },
    });
    return null;
  }

  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    res.status(403).json({
      data: null,
      error: {
        message:
          "Only admin and staff accounts can use PIN recovery.",
      },
    });
    return null;
  }

  return { normalizedEmail, user };
};

export const forgotPin = async (req, res) => {
  try {
    const { email, recoveryEmail } = req.body;

    requireFields(req.body, ["email", "recoveryEmail"]);

    // Whitelist gate first so unauthorized mailboxes learn nothing about
    // which accounts exist.
    const normalizedRecoveryEmail = validateRecoveryEmail(
      res,
      recoveryEmail,
    );

    if (!normalizedRecoveryEmail) {
      return;
    }

    const validated = await findPinResetAccount(res, email);

    if (!validated) {
      return;
    }

    const { normalizedEmail, user } = validated;

    const record = await PinReset.findOne({ email: normalizedEmail });

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
      await issuePinResetCode(user, normalizedRecoveryEmail);
    } catch (emailError) {
      console.error("PIN reset email error:", emailError.message);

      return res.status(502).json({
        data: null,
        error: {
          message: "We could not send the PIN reset email. Please try again.",
        },
      });
    }

    return res.status(200).json({
      data: {
        message: `A 6-digit reset code was sent to ${normalizedRecoveryEmail}.`,
        email: normalizedEmail,
        recoveryEmail: normalizedRecoveryEmail,
      },
      error: null,
    });
  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
      data: null,
      error: {
        message: error.message || "Could not start the PIN reset",
      },
    });
  }
};

export const verifyPinResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    requireFields(req.body, ["email", "code"]);

    // No whitelist re-check here: a PinReset record can only exist because a
    // whitelisted recovery mailbox already received a code for this account.
    const validated = await findPinResetAccount(res, email);

    if (!validated) {
      return;
    }

    const { normalizedEmail } = validated;
    const submittedCode = typeof code === "string" ? code.trim() : "";

    if (!/^\d{6}$/.test(submittedCode)) {
      return res.status(400).json({
        data: null,
        error: {
          message: "Enter the 6-digit code from your email.",
        },
      });
    }

    const record = await PinReset.findOne({ email: normalizedEmail });

    if (!record) {
      return res.status(400).json({
        data: null,
        error: {
          message: "No reset code found. Please request a new one.",
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
          message: "Incorrect reset code.",
          attemptsRemaining: Math.max(
            0,
            VERIFICATION_MAX_ATTEMPTS - record.attempts,
          ),
        },
      });
    }

    return res.status(200).json({
      data: {
        verified: true,
        email: normalizedEmail,
      },
      error: null,
    });
  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
      data: null,
      error: {
        message: error.message || "Code verification failed",
      },
    });
  }
};

export const setNewPin = async (req, res) => {
  try {
    const { email, code, pin } = req.body;

    requireFields(req.body, ["email", "code", "pin"]);

    const validated = await findPinResetAccount(res, email);

    if (!validated) {
      return;
    }

    const { normalizedEmail, user } = validated;
    const submittedCode = typeof code === "string" ? code.trim() : "";
    const submittedPin = typeof pin === "string" ? pin.trim() : "";

    if (!/^\d{6}$/.test(submittedCode)) {
      return res.status(400).json({
        data: null,
        error: {
          message: "Enter the 6-digit code from your email.",
        },
      });
    }

    if (!/^\d{6}$/.test(submittedPin)) {
      return res.status(400).json({
        data: null,
        error: {
          message: "PIN must be exactly 6 digits.",
        },
      });
    }

    const record = await PinReset.findOne({ email: normalizedEmail });

    if (!record) {
      return res.status(400).json({
        data: null,
        error: {
          message: "No reset code found. Please request a new one.",
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
          message: "Incorrect reset code.",
          attemptsRemaining: Math.max(
            0,
            VERIFICATION_MAX_ATTEMPTS - record.attempts,
          ),
        },
      });
    }

    user.pinHash = await bcrypt.hash(submittedPin, 12);
    await user.save();

    await PinReset.deleteOne({ _id: record._id });

    // A successful reset proves mailbox control, so any pending lockout
    // from wrong PIN attempts is cleared.
    await LoginThrottle.deleteOne({ email: normalizedEmail });

    if (user.role === "ADMIN") {
      try {
        await recordAuditLog({
          adminId: user._id,
          action: "PIN_RESET",
          resourceType: "AUTH",
          resourceId: user._id,
          details: "Administrator PIN reset via emailed code.",
        });
      } catch (auditError) {
        console.error("Audit log error:", auditError.message);
      }
    }

    return res.status(200).json({
      data: {
        reset: true,
        email: normalizedEmail,
      },
      error: null,
    });
  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
      data: null,
      error: {
        message: error.message || "PIN reset failed",
      },
    });
  }
};
