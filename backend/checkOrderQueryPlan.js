import dotenv from "dotenv";
import mongoose from "mongoose";

import Order from "./src/models/Order.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    // Get one existing order so we can test
    // the same userId-based query used by getOrders().
    const sampleOrder = await Order.findOne().select("userId").lean();

    if (!sampleOrder) {
      console.log("No orders found in the database.");
      await mongoose.disconnect();
      return;
    }

    const result = await Order.find({
      userId: sampleOrder.userId,
    })
      .sort({
        createdAt: -1,
      })
      .limit(10)
      .explain("executionStats");

    console.log("\n=== ORDER QUERY PLAN ===");
    console.dir(result, { depth: null });

    await mongoose.disconnect();
  } catch (error) {
    console.error("Order query plan check failed:");
    console.error(error);
    process.exit(1);
  }
};

run();
