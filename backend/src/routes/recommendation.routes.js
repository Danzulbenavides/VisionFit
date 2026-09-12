import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";

import { getRecommendations } from "../controllers/recommendation.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", getRecommendations);

export default router;
