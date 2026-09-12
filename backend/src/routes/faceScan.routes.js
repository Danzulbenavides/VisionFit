import { Router } from "express";

import multer from "multer";

import authenticate from "../middleware/auth.middleware.js";

import { analyzeFaceScan } from "../controllers/faceScan.controller.js";

const router = Router();

// =========================================
// MULTER MEMORY STORAGE
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
      return callback(new Error("Only JPEG images are supported"));
    }

    callback(null, true);
  },
});

// =========================================
// AUTHENTICATION
// =========================================

router.use(authenticate);

// =========================================
// FACE SCAN ANALYSIS
// =========================================

router.post("/analyze", upload.single("image"), analyzeFaceScan);

export default router;
