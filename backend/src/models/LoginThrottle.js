import mongoose from "mongoose";

// Tracks failed login attempts per email address so the API can lock an
// account after too many wrong passwords. Kept in its own collection (instead
// of on the User document) because attempts with a non-existent email must be
// counted too.
const loginThrottleSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    failedAttempts: {
      type: Number,
      default: 0,
    },

    // Number of times this email has been locked out. Drives the escalation
    // (5 minutes, then 15, then 30).
    strikes: {
      type: Number,
      default: 0,
    },

    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const LoginThrottle = mongoose.model("LoginThrottle", loginThrottleSchema);

export default LoginThrottle;
