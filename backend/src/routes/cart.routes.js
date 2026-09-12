import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";

import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cart.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", getCart);

router.post("/items", addCartItem);

router.patch("/items/:productId", updateCartItem);

router.delete("/items/:productId", removeCartItem);

router.delete("/", clearCart);

export default router;
