import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";

import {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
} from "../controllers/prescription.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", createPrescription);
router.get("/", getPrescriptions);
router.get("/:id", getPrescriptionById);
router.patch("/:id", updatePrescription);
router.delete("/:id", deletePrescription);

export default router;
