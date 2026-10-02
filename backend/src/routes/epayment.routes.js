import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";

import { initiatePayment, handleWebhook } from "../controllers/epayment.controller.js";

const router = Router();

router.post("/webhook", handleWebhook);

router.post("/initiate", authenticate, initiatePayment);

export default router;