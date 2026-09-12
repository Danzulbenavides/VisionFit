import path from "node:path";
import { fileURLToPath } from "node:url";

import * as tf from "@tensorflow/tfjs";
import * as wasm from "@tensorflow/tfjs-backend-wasm";

import * as faceapi from "@vladmandic/face-api/dist/face-api.node-wasm.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wasmDirectory = path.join(
  __dirname,
  "node_modules",
  "@tensorflow",
  "tfjs-backend-wasm",
  "dist",
);

console.log("WASM directory:");
console.log(wasmDirectory);

wasm.setWasmPaths(`${wasmDirectory}${path.sep}`);

try {
  const result = await tf.setBackend("wasm");

  console.log("setBackend result:", result);

  await tf.ready();

  console.log("TensorFlow backend:", tf.getBackend());

  console.log("FaceAPI loaded:", Boolean(faceapi.nets));
} catch (error) {
  console.error("WASM initialization failed:");

  console.error(error);
}
