#!/usr/bin/env node

// Set or rotate the static 6-digit PIN used by the admin and staff web apps.
//
//   node scripts/set-pin.js --email admin@visionfit.com --pin 123456
//   node scripts/set-pin.js --backfill            # default PIN for any
//                                                  # ADMIN/STAFF without one

import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env file");
  process.exit(1);
}

const DEFAULT_PIN = "123456";

const args = process.argv.slice(2);

const getFlag = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1] ?? null;
};

const email = getFlag("--email");
const pin = getFlag("--pin") || DEFAULT_PIN;
const backfill = args.includes("--backfill");

if (!backfill && !email) {
  console.error("Usage:");
  console.error("  node scripts/set-pin.js --email <email> [--pin <6 digits>]");
  console.error("  node scripts/set-pin.js --backfill");
  process.exit(1);
}

if (!/^\d{6}$/.test(pin)) {
  console.error("PIN must be exactly 6 digits.");
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);

    console.log("Connected to MongoDB");

    if (backfill) {
      const users = await User.find({
        role: { $in: ["ADMIN", "STAFF"] },
        $or: [{ pinHash: null }, { pinHash: { $exists: false } }],
      });

      if (users.length === 0) {
        console.log("All ADMIN/STAFF accounts already have a PIN.");
        return;
      }

      const pinHash = await bcrypt.hash(pin, 12);

      for (const user of users) {
        user.pinHash = pinHash;
        await user.save();
        console.log(`Set PIN for ${user.email} (${user.role})`);
      }

      console.log(`\nBackfill complete. Default PIN: ${pin}`);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.error(`No user found for ${normalizedEmail}`);
      process.exit(1);
    }

    if (user.role !== "ADMIN" && user.role !== "STAFF") {
      console.error(
        `${normalizedEmail} is ${user.role}; only ADMIN/STAFF accounts use the web PIN.`,
      );
      process.exit(1);
    }

    user.pinHash = await bcrypt.hash(pin, 12);
    await user.save();

    console.log(`PIN updated for ${user.email} (${user.role}): ${pin}`);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();
