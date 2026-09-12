import path from "node:path";
import { fileURLToPath } from "node:url";

import { analyzeFaceImageFile } from "./src/services/faceAnalysis.service.js";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const imagePath = path.join(__dirname, "test-images", "face.jpg");

try {
  console.log("========================================");

  console.log("VisionFit Face Analysis Test");

  console.log("========================================");

  console.log("Image:", imagePath);

  const result = await analyzeFaceImageFile(imagePath);

  console.log("\nRESULT");

  console.log("========================================");

  console.log(JSON.stringify(result, null, 2));

  console.log("\nFace Shape:", result.faceShape);

  console.log("Estimated PD:", `${result.pupilDistance} mm`);

  console.log("Estimated Face Width:", `${result.faceWidth} mm`);

  console.log("Estimated Face Length:", `${result.faceLength} mm`);

  console.log("Confidence:", `${Math.round(result.confidence * 100)}%`);

  console.log("\nFace analysis completed successfully.");
} catch (error) {
  console.error("\nFace analysis failed:");

  console.error(error);

  process.exit(1);
}
