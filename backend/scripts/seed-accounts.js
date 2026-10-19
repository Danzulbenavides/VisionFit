#!/usr/bin/env node

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

// Parse the URI to get the database name (for logging)
const uriObj = new URL(MONGODB_URI.replace("mongodb+srv://", "mongodb://"));
const dbName = uriObj.pathname.substring(1); // Remove leading slash

const args = process.argv.slice(2);
const confirm = args.includes("--confirm");

if (!confirm) {
  console.log("DRY RUN MODE");
  console.log(`Database URI: ${MONGODB_URI.replace(/:[^:@]+@/, ":****@")}`); // Hide password
  console.log(`Database name: ${dbName}`);
}

// Default 6-digit PIN for admin/staff web login (change with set-pin.js)
const DEFAULT_STAFF_PIN = "123456";

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, {
      
    });

    console.log("Connected to MongoDB");

    // Define the seed users
    const seedUsers = [
      {
        email: "admin@visionfit.com",
        role: "ADMIN",
        firstName: "Admin",
        lastName: "User",
      },
      {
        email: "staff@visionfit.com",
        role: "STAFF",
        firstName: "Staff",
        lastName: "User",
      },
      {
        email: "customer@visionfit.com",
        role: "CUSTOMER",
        firstName: "Customer",
        lastName: "User",
      },
    ];

    for (const userData of seedUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.email} already exists. Skipping.`);

        // Backfill the admin/staff web PIN so existing seed accounts can
        // pass the new PIN step.
        if (
          (userData.role === "ADMIN" || userData.role === "STAFF") &&
          !existingUser.pinHash
        ) {
          existingUser.pinHash = await bcrypt.hash(DEFAULT_STAFF_PIN, 12);
          await existingUser.save();
          console.log(`  Set default PIN ${DEFAULT_STAFF_PIN} for web login.`);
        }

        continue;
      }

      // Generate a random password
      const randomPassword = Math.random().toString(36).slice(-12); // 12-character random string
      // Generate a random Philippine mobile number (09 followed by 9 digits)
      const randomPhone = "09" + Math.floor(100000000 + Math.random() * 900000000).toString();

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      // Admin/staff accounts also get the static 6-digit PIN used by the
      // admin and staff web apps.
      const pinHash =
        userData.role === "ADMIN" || userData.role === "STAFF"
          ? await bcrypt.hash(DEFAULT_STAFF_PIN, 12)
          : null;

      const user = new User({
        ...userData,
        passwordHash,
        pinHash,
        phone: randomPhone,
        emailVerified: true, // Assume email is verified for seed users
        isActive: true,
      });

      await user.save();
      console.log(`Created user: ${userData.email} (role: ${userData.role})`);
      console.log(`  Generated password: ${randomPassword}`);
      if (pinHash) {
        console.log(`  Web login PIN: ${DEFAULT_STAFF_PIN}`);
      }
      console.log(`  Phone number: ${randomPhone}`);
      console.log("  -> Please change password after first login!");
    }

    console.log("\nSeed users creation completed.");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();