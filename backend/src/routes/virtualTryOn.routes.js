import { Router } from "express";
import multer from "multer";

import authenticate from "../middleware/auth.middleware.js";

import { virtualTryOn } from "../controllers/virtualTryOn.controller.js";

const router = Router();

// =========================================
// MULTER
// =========================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,

    files: 1,
  },

  fileFilter: (req, file, callback) => {
    const allowedMimeTypes = ["image/jpeg", "image/jpg"];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(new Error("Only JPEG images are supported."));
    }

    callback(null, true);
  },
});

// =========================================
// AUTHENTICATION
// =========================================

router.use(authenticate);

// =========================================
// VIRTUAL TRY-ON
// =========================================

router.post("/:productId", upload.single("image"), virtualTryOn);

export default router;
