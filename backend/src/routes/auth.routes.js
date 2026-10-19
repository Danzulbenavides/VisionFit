import { Router } from "express";

import {
  register,
  login,
  verifyPin,
  verifyEmail,
  resendVerification,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  forgotPin,
  verifyPinResetCode,
  setNewPin,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-pin", verifyPin);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);
router.post("/forgot-pin", forgotPin);
router.post("/verify-pin-code", verifyPinResetCode);
router.post("/reset-pin", setNewPin);

export default router;
