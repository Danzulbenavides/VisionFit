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
      enum: ["CUSTOMER", "ADMIN"],
      default: "CUSTOMER",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
