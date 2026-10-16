import dotenv from "dotenv";
// Load .env.local if it exists, otherwise fallback to .env
const result = dotenv.config({ path: '.env.local' });
if (result.error) {
  dotenv.config(); // fallback to .env
}

import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VisionFit API running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed:");
  console.error(error);
  process.exit(1);
});
