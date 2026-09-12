import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";

import { createUserEvent } from "../controllers/userEvent.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", createUserEvent);

export default router;
