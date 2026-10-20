import { Router } from "express";
import multer from "multer";
import ApiError from "../utils/ApiError.js";
import { uploadProductImage } from "../controllers/productImage.controller.js";

import authenticate from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";

import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

const router = Router();

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const supported = ["image/jpeg", "image/png", "image/webp"].includes(
      file.mimetype,
    );
    callback(null, supported);
  },
});

const uploadSingleImage = (req, res, next) => {
  imageUpload.single("image")(req, res, (error) => {
    if (
      error instanceof multer.MulterError &&
      error.code === "LIMIT_FILE_SIZE"
    ) {
      return next(new ApiError(400, "Image must be 5 MB or smaller."));
    }
    if (error) return next(error);
    next();
  });
};

// Public catalog
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin + Staff: upload images and manage products
router.post(
  "/upload-image",
  authenticate,
  requireRole("ADMIN", "STAFF"),
  uploadSingleImage,
  uploadProductImage,
);
router.post("/", authenticate, requireRole("ADMIN", "STAFF"), createProduct);

router.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN", "STAFF"),
  updateProduct,
);

router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN", "STAFF"),
  deleteProduct,
);

export default router;
