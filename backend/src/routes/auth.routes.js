import { Router } from "express";

import {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

export default router;
