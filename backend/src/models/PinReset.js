import mongoose from "mongoose";

// 6-digit codes emailed for the admin/staff "Forgot PIN" flow. Mirrors
// PasswordReset but is a separate collection so PIN recovery attempts can
// never touch active password-reset records.
const pinResetSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    code: {
      type: String,
      required: true,
    },

    // Which authorized mailbox the code was emailed to (the account above is
    // the account whose PIN gets reset; this is purely for auditing).
    recoveryEmail: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const PinReset = mongoose.model("PinReset", pinResetSchema);

export default PinReset;
