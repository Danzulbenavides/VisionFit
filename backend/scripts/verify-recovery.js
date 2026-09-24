import "dotenv/config";
import mongoose from "mongoose";

const expected = {
  faceMeasurements: 21,
  products: 13,
  userEvents: 12,
  orders: 12,
  users: 5,
  addresses: 3,
  carts: 3,
  prescriptions: 3,
  articles: 1,
  reviews: 1,
  favorites: 1,
};

const verifyRecovery = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "visionfit_recovery_test",
    });

    console.log("Connected to: visionfit_recovery_test");

    const db = mongoose.connection.db;

    let totalDocuments = 0;
    let allCountsMatch = true;

    for (const [collectionName, expectedCount] of Object.entries(expected)) {
      const count = await db.collection(collectionName).countDocuments();

      totalDocuments += count;

      const status = count === expectedCount ? "OK" : "MISMATCH";

      if (count !== expectedCount) {
        allCountsMatch = false;
      }

      console.log(
        `${status} ${collectionName}: ${count} documents (expected ${expectedCount})`,
      );
    }

    console.log(`Total recovered documents: ${totalDocuments}`);

    if (allCountsMatch && totalDocuments === 75) {
      console.log("Recovery verification successful.");
    } else {
      console.error("Recovery verification failed.");
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("Recovery verification error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

verifyRecovery();
