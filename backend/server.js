import dotenv from "dotenv";
dotenv.config();

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
