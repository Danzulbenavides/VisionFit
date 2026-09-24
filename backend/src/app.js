import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import productRoutes from "./routes/product.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import prescriptionRoutes from "./routes/prescription.routes.js";
import faceMeasurementRoutes from "./routes/faceMeasurement.routes.js";
import recommendationRoutes from "./routes/recommendation.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import addressRoutes from "./routes/address.routes.js";
import favoriteRoutes from "./routes/favorite.routes.js";
import articleRoutes from "./routes/article.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import userEventRoutes from "./routes/userEvent.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import faceScanRoutes from "./routes/faceScan.routes.js";
import virtualTryOnRoutes from "./routes/virtualTryOn.routes.js";
import auditLogRoutes from "./routes/auditLog.routes.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  notFoundHandler,
  errorHandler,
} from "./middleware/error.middleware.js";
import { analyzeFaceImage } from "./services/aiService.js";
import requestLogger from "./middleware/requestLogger.middleware.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// -----------------------------------------
// Security headers
// -----------------------------------------

app.use(helmet());

// -----------------------------------------
// CORS
// -----------------------------------------

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // React Native requests may not send an Origin header.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },

    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],

    credentials: true,
  }),
);
// -----------------------------------------
// JSON body parser
// -----------------------------------------

app.use(
  express.json({
    limit: "1mb",
  }),
);

// -----------------------------------------
// API request monitoring
// -----------------------------------------

app.use(requestLogger);

// -----------------------------------------
// Authentication rate limiter
// -----------------------------------------

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: {
      message: "Too many authentication requests. Please try again later.",
    },
  },
});

// -----------------------------------------
// Health
// -----------------------------------------

app.get("/api/health", (req, res) => {
  res.status(200).json({
    data: {
      status: "OK",
      service: "VisionFit API",
    },
    error: null,
  });
});

app.post("/test-ai", async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Node.js is connected to the Python AI service.",
    });
  } catch (error) {
    console.error("AI service test error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to connect to AI service.",
    });
  }
});

app.use("/api/products", productRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/face-measurements", faceMeasurementRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/events", userEventRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/admin/audit-logs", auditLogRoutes);
app.use("/api/face-scan", faceScanRoutes);
app.use("/api/virtual-try-on", virtualTryOnRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
