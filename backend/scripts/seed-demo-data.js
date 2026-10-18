#!/usr/bin/env node

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import Product from "../src/models/Product.js";
import Order from "../src/models/Order.js";
import UserEvent from "../src/models/UserEvent.js";

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
    // Helper to pick random element from array
    const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // First, delete any existing demo data to ensure idempotency
    console.log("Removing existing demo data...");
    const demoOrderResult = await Order.deleteMany({ orderNumber: { $regex: /^VF-DEMO-/ } });
    const demoEventResult = await UserEvent.deleteMany({ "metadata.demo": true });
    console.log(`Removed ${demoOrderResult.deletedCount} demo orders`);
    console.log(`Removed ${demoEventResult.deletedCount} demo user events`);

    // Get seed users (by email)
    const seedUsers = await User.find({
      email: { $in: ["admin@visionfit.com", "staff@visionfit.com", "customer@visionfit.com"] }
    });
    if (seedUsers.length === 0) {
      console.error("Seed users not found. Please run seed-accounts.js first.");
      process.exit(1);
    }
    console.log(`Found ${seedUsers.length} seed users`);

    // Get all products for order items
    const products = await Product.find({ isActive: true });
    if (products.length === 0) {
      console.error("No active products found. Please run seed-products.js first.");
      process.exit(1);
    }
    console.log(`Found ${products.length} active products`);

    // Generate demo orders (30-40)
    const orderCount = randomInt(30, 40);
    console.log(`Generating ${orderCount} demo orders...`);
    const orders = [];
    for (let i = 0; i < orderCount; i++) {
      const user = randomChoice(seedUsers);
      // Pick 1 to 5 random products for this order
      const numItems = randomInt(1, 5);
      const selectedProducts = [];
      for (let j = 0; j < numItems; j++) {
        selectedProducts.push(randomChoice(products));
      }

      // Calculate order totals
      let subtotal = 0;
      const items = [];
      for (const product of selectedProducts) {
        const quantity = randomInt(1, 3);
        const unitPrice = parseFloat(product.price);
        subtotal += quantity * unitPrice;
        items.push({
          productId: product._id,
          productName: product.name,
          quantity,
          unitPrice: parseFloat(unitPrice.toFixed(2)),
          // We'll set default values for other required fields in orderItemSchema
          lensType: "FRAME_ONLY",
          prescriptionId: null,
          prescriptionSnapshot: null,
          coating: "NONE",
        });
      }

      const shippingFee = randomFloat(0, 150); // random shipping fee
      const discount = randomFloat(0, subtotal * 0.2); // up to 20% discount
      const total = subtotal + shippingFee - discount;

      // Create a demo order number
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const orderNumber = `VF-DEMO-${timestamp}-${randomSuffix}`;

      // Create a fake address snapshot (we'll use placeholder data)
      const addressSnapshot = {
        firstName: user.firstName,
        lastName: user.lastName,
        country: "Philippines",
        street: "123 Demo Street",
        apartment: "",
        city: "Demo City",
        province: "Demo Province",
        postalCode: "1234",
        phone: user.phone, // use user's phone
      };

      const order = new Order({
        userId: user._id,
        orderNumber,
        items,
        addressSnapshot,
        subtotal: parseFloat(subtotal.toFixed(2)),
        shippingFee: parseFloat(shippingFee.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        paymentMethod: randomChoice(["COD", "E_WALLET", "CARD"]),
        paymentStatus: randomChoice(["PENDING", "PAID", "PAID"]), // bias towards paid
        orderStatus: randomChoice(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "DELIVERED"]), // bias towards delivered
        paymentReference: null,
        paymentGatewayMetadata: null,
        cancellationReason: null,
      });

      orders.push(order);
    }

    // Insert orders
    const createdOrders = await Order.insertMany(orders);
    console.log(`Created ${createdOrders.length} demo orders`);

    // Generate demo user events (100-200)
    const eventCount = randomInt(100, 200);
    console.log(`Generating ${eventCount} demo user events...`);
    const eventTypes = [
      "PRODUCT_VIEW",
      "ADD_TO_CART",
      "REMOVE_FROM_CART",
      "FAVORITE",
      "UNFAVORITE",
      "FACE_SCAN",
      "RECOMMENDATION_FEEDBACK",
      "CHECKOUT_STARTED",
      "ORDER_COMPLETED",
    ];

    const userEvents = [];
    for (let i = 0; i < eventCount; i++) {
      const user = randomChoice(seedUsers);
      const eventType = randomChoice(eventTypes);

      // Randomly associate with a product (for product-related events)
      let productId = null;
      if (["PRODUCT_VIEW", "ADD_TO_CART", "REMOVE_FROM_CART", "FAVORITE", "UNFAVORITE"].includes(eventType)) {
        productId = randomChoice(products)._id;
      }

      // Randomly associate with an order (for order-related events)
      let orderId = null;
      if (["CHECKOUT_STARTED", "ORDER_COMPLETED"].includes(eventType)) {
        orderId = randomChoice(createdOrders)._id;
      }

      // Generate a random timestamp within the last 30 days
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      const timestamp = new Date(thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo));

      const userEvent = new UserEvent({
        userId: user._id,
        eventType,
        productId: productId || undefined,
        orderId: orderId || undefined,
        metadata: {
          demo: true,
          // Add any other metadata if needed
        },
        timestamp,
      });

      userEvents.push(userEvent);
    }

    // Insert user events
    const createdEvents = await UserEvent.insertMany(userEvents);
    console.log(`Created ${createdEvents.length} demo user events`);

    console.log("\nDemo data generation completed.");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();