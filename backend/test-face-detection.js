import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as tf from "@tensorflow/tfjs";
import * as wasm from "@tensorflow/tfjs-backend-wasm";

import * as faceapi from "@vladmandic/face-api/dist/face-api.node-wasm.js";

import jpeg from "jpeg-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_PATH = path.join(__dirname, "models", "faceapi");

const IMAGE_PATH = path.join(__dirname, "test-images", "face.jpg");

// =========================================
// INITIALIZE TENSORFLOW WASM
// =========================================

wasm.setWasmPaths(
  `file://${path.join(
    __dirname,
    "node_modules",
    "@tensorflow",
    "tfjs-backend-wasm",
    "dist",
  )}${path.sep}`,
);

const backendSet = await tf.setBackend("wasm");

if (!backendSet) {
  throw new Error("Unable to set TensorFlow WASM backend.");
}

await tf.ready();

console.log("TensorFlow backend:", tf.getBackend());

// =========================================
// LOAD MODELS
// =========================================

console.log("Loading face detection model...");

await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_PATH);

console.log("Tiny Face Detector loaded.");

console.log("Loading 68-point landmark model...");

await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);

console.log("68-point landmark model loaded.");

// =========================================
// LOAD JPEG
// =========================================

if (!fs.existsSync(IMAGE_PATH)) {
  throw new Error(`Test image not found: ${IMAGE_PATH}`);
}

const imageBuffer = fs.readFileSync(IMAGE_PATH);

const decoded = jpeg.decode(imageBuffer, {
  useTArray: true,
});

console.log(`Image size: ${decoded.width} x ${decoded.height}`);

// =========================================
// CONVERT IMAGE TO TENSOR
// =========================================

const rgbData = new Int32Array(decoded.width * decoded.height * 3);

for (let index = 0; index < decoded.width * decoded.height; index++) {
  const sourceIndex = index * 4;

  const targetIndex = index * 3;

  rgbData[targetIndex] = decoded.data[sourceIndex];

  rgbData[targetIndex + 1] = decoded.data[sourceIndex + 1];

  rgbData[targetIndex + 2] = decoded.data[sourceIndex + 2];
}

const imageTensor = tf.tensor3d(
  rgbData,
  [decoded.height, decoded.width, 3],
  "int32",
);

// =========================================
// DETECT FACE
// =========================================

console.log("Detecting face...");

const detection = await faceapi
  .detectSingleFace(
    imageTensor,
    new faceapi.TinyFaceDetectorOptions({
      inputSize: 320,
      scoreThreshold: 0.5,
    }),
  )
  .withFaceLandmarks();

if (!detection) {
  imageTensor.dispose();

  throw new Error("No face detected in test image.");
}

// =========================================
// OUTPUT DETECTION
// =========================================

console.log("\nFACE DETECTED");

console.log("==============================");

console.log("Detection score:", detection.detection.score);

console.log("Bounding box:", detection.detection.box);

const landmarks = detection.landmarks;

const positions = landmarks.positions;

console.log("Landmark count:", positions.length);

console.log("\nFirst 10 landmarks:");

console.log(positions.slice(0, 10));

console.log("\nLandmark groups:");

console.log(landmarks.getJawOutline());

console.log(landmarks.getLeftEye());

console.log(landmarks.getRightEye());

console.log(landmarks.getNose());

console.log(landmarks.getMouth());

imageTensor.dispose();

console.log("\nFace detection test completed.");
