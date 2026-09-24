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
        isActive: true,
        stock: { $gt: 0 },
        frameShape: {
          $in: ["RECTANGLE", "SQUARE", "BROWLINE"],
        },
      })
      .limit(100)
      .explain("executionStats");

    console.log("\n=== RECOMMENDATION QUERY PLAN ===");
    console.dir(result, { depth: null });

    await mongoose.disconnect();
  } catch (error) {
    console.error("Recommendation query plan check failed:");
    console.error(error);
    process.exit(1);
  }
};

run();
