#!/usr/bin/env node

import dns from "dns";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../src/models/Product.js";
import {
  DEFAULT_LENS_TYPE_PRICES,
  DEFAULT_COATING_PRICES,
} from "../src/utils/lensPricing.js";

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
  console.log("DRY RUN MODE (no changes will be written)");
  console.log(`Database URI: ${MONGODB_URI.replace(/:[^:@]+@/, ":****@")}`); // Hide password
  console.log(`Database name: ${dbName}`);
  console.log("");
}

async function run() {
  try {
    try {
      await mongoose.connect(MONGODB_URI);
    } catch (err) {
      // Some networks break SRV lookups on the default resolver.
      // Retry once with public DNS servers before giving up.
      if (err?.code === "ETIMEOUT" || /querySrv/i.test(String(err))) {
        console.log(
          "SRV DNS lookup timed out — retrying with public DNS (8.8.8.8, 1.1.1.1)...",
        );
        dns.setServers(["8.8.8.8", "1.1.1.1"]);
        await mongoose.connect(MONGODB_URI);
      } else {
        throw err;
      }
    }

    console.log("Connected to MongoDB");

    const total = await Product.countDocuments();

    console.log(`Total products: ${total}`);

    if (total === 0) {
      console.log("Nothing to update.");
      return;
    }

    // Show one product's current prices as a before/after sample
    const sample = await Product.findOne();

    console.log("\nPrice table to apply:");
    console.log("  Lens types:", DEFAULT_LENS_TYPE_PRICES);
    console.log("  Coatings:  ", DEFAULT_COATING_PRICES);

    console.log("\nSample product before:");
    console.log(`  ${sample.name}`);
    console.log("  lensTypePrices:", sample.lensTypePrices?.toObject?.() ?? sample.lensTypePrices ?? "(not set)");
    console.log("  coatingPrices: ", sample.coatingPrices?.toObject?.() ?? sample.coatingPrices ?? "(not set)");

    if (!confirm) {
      console.log("\nDRY RUN complete — no changes written.");
      console.log("Run again with --confirm to apply these prices to ALL products.");
      return;
    }

    const result = await Product.updateMany(
      {},
      {
        $set: {
          lensTypePrices: { ...DEFAULT_LENS_TYPE_PRICES },
          coatingPrices: { ...DEFAULT_COATING_PRICES },
        },
      },
    );

    console.log(`\nUpdated ${result.modifiedCount} of ${total} products.`);

    // Verify the sample after the write
    const updatedSample = await Product.findById(sample._id);

    console.log("\nSample product after:");
    console.log(`  ${updatedSample.name}`);
    console.log("  lensTypePrices:", updatedSample.lensTypePrices?.toObject?.() ?? updatedSample.lensTypePrices);
    console.log("  coatingPrices: ", updatedSample.coatingPrices?.toObject?.() ?? updatedSample.coatingPrices);

    console.log("\nDone — all products now use this price table.");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();
