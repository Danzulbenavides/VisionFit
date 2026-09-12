import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";

import {
  createAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", createAddress);

router.get("/", getAddresses);

router.get("/:id", getAddressById);

router.patch("/:id", updateAddress);

router.delete("/:id", deleteAddress);

export default router;
