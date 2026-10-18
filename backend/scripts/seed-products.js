#!/usr/bin/env node

import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../src/models/Product.js";

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

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, {
    });

    console.log("Connected to MongoDB");

    // Helper to generate random integer in range
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    // Helper to generate random float in range
    const randomFloat = (min, max) => Math.random() * (max - min) + min;

    // Arrays for random selection
    const categories = ["EYEGLASSES", "SUNGLASSES", "BLUE_LIGHT"];
    const frameShapes = [
      "SQUARE",
      "RECTANGLE",
      "ROUND",
      "CAT_EYE",
      "BROWLINE",
      "AVIATOR",
      "BUTTERFLY",
      "GEOMETRIC",
    ];
    const materials = ["TR90", "ACETATE", "PLASTIC", "METAL", "TITANIUM", "MIXED"];
    const genders = ["WOMEN", "MEN", "UNISEX"];
    const colorsList = [
      "Black",
      "Brown",
      "Tortoise",
      "Gold",
      "Silver",
      "Blue",
      "Red",
      "Green",
      "Purple",
      "Pink",
      "White",
      "Gray",
    ];

    // Generate 25 products
    const productsToSeed = [];
    for (let i = 1; i <= 25; i++) {
      // Generate random colors (2 to 5 colors)
      const numColors = randomInt(2, 5);
      const colors = [];
      for (let j = 0; j < numColors; j++) {
        colors.push(colorsList[randomInt(0, colorsList.length - 1)]);
      }
      // Remove duplicates
      const uniqueColors = [...new Set(colors)];

      // Generate random size
      const size = {
        frameWidth: randomInt(120, 150), // mm
        bridgeWidth: randomInt(10, 25),
        lensWidth: randomInt(40, 60),
        lensHeight: randomInt(30, 50),
        templeLength: randomInt(120, 150),
      };

      // Generate random prescription compatibility
      const prescriptionCompatibility = {
        minRx: randomFloat(-10.0, 0.0), // negative for myopia
        maxRx: randomFloat(0.0, 8.0),   // positive for hyperopia
        progressive: randomInt(0, 1) === 1,
        bifocal: randomInt(0, 1) === 1,
        readers: randomInt(0, 1) === 1,
      };

      // Generate random images (placeholder URLs)
      const numImages = randomInt(1, 4);
      const images = [];
      for (let j = 0; j < numImages; j++) {
        // Using placeholder.com for dummy images
        images.push(`https://via.placeholder.com/300x200?text=Product+${i}+Image+${j + 1}`);
      }

      const product = {
        name: `VisionFit Model ${i}`,
        brand: randomInt(1, 10) <= 8 ? "VisionFit" : "LuxuryBrand",
        description: `High-quality ${frameShapes[randomInt(0, frameShapes.length - 1)].toLowerCase()} frame made of ${materials[randomInt(0, materials.length - 1)].toLowerCase()}.`,
        price: randomFloat(100, 5000).toFixed(2), // Ensure two decimal places
        category: categories[randomInt(0, categories.length - 1)],
        frameShape: frameShapes[randomInt(0, frameShapes.length - 1)],
        material: materials[randomInt(0, materials.length - 1)],
        colors: uniqueColors,
        size: size,
        weight: randomFloat(10, 50).toFixed(1),
        genderCategory: genders[randomInt(0, genders.length - 1)],
        prescriptionCompatibility: prescriptionCompatibility,
        images: images,
        tryOnImage: null, // We don't have actual try-on images for seed data
        tryOnScale: 1,
        tryOnOffsetX: 0,
        tryOnOffsetY: 0,
        stock: randomInt(0, 100),
        isActive: randomInt(1, 10) <= 8, // 80% chance active
      };

      productsToSeed.push(product);
    }

    // Insert products if they don't already exist (by name)
    for (const productData of productsToSeed) {
      const existingProduct = await Product.findOne({ name: productData.name });
      if (existingProduct) {
        console.log(`Product "${productData.name}" already exists. Skipping.`);
        continue;
      }

      const product = new Product(productData);
      await product.save();
      console.log(`Created product: ${productData.name}`);
    }

    console.log("\nProducts seeding completed.");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();