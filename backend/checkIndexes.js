import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    const collection = mongoose.connection.db.collection("products");

    const indexes = await collection.indexes();
    const productCount = await collection.countDocuments();

    console.log("\n=== PRODUCT INDEXES ===");
    console.dir(indexes, { depth: null });

    console.log("\n=== PRODUCT COUNT ===");
    console.log(productCount);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Index check failed:");
    console.error(error);
    process.exit(1);
  }
};

run();
