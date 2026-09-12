import { Router } from "express";

import authenticate from "../middleware/auth.middleware.js";

import {
  createFaceMeasurement,
  getFaceMeasurements,
  getFaceMeasurementById,
  deleteFaceMeasurement,
} from "../controllers/faceMeasurement.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", createFaceMeasurement);
router.get("/", getFaceMeasurements);
router.get("/:id", getFaceMeasurementById);
router.delete("/:id", deleteFaceMeasurement);

export default router;
