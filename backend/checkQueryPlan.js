import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    const collection = mongoose.connection.db.collection("products");

    const result = await collection
      .find({
        category: "EYEGLASSES",
        isActive: true,
        price: { $gte: 0 },
      })
      .sort({ price: 1 })
      .limit(12)
      .explain("executionStats");

    console.log("\n=== QUERY PLAN ===");
    console.dir(result, { depth: null });

    await mongoose.disconnect();
  } catch (error) {
    console.error("Query plan check failed:");
    console.error(error);
    process.exit(1);
  }
};

run();
