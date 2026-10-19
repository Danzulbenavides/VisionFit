import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    // bcrypt hash of the static 6-digit PIN required by the admin and staff
    // web apps before a session token is issued. null for customers and for
    // any account that has not been given a PIN yet.
    pinHash: {
      type: String,
      default: null,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: (value) => /^09\d{9}$/.test(value),
        message:
          "Phone number must be a valid 11-digit Philippine mobile number starting with 09.",
      },
    },

    role: {
      type: String,
      enum: ["CUSTOMER", "STAFF", "ADMIN"],
      default: "CUSTOMER",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    suspensionReason: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    // Expo push tokens of the devices logged in to this account
    pushTokens: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;