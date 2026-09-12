import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";

import {
  addFavorite,
  getFavorites,
  getFavoriteByProduct,
  removeFavorite,
} from "../controllers/favorite.controller.js";

const router = Router();

router.use(authenticate);

router.post("/:productId", addFavorite);

router.get("/", getFavorites);

router.get("/:productId", getFavoriteByProduct);

router.delete("/:productId", removeFavorite);

export default router;
