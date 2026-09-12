import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as tf from "@tensorflow/tfjs";
import * as wasm from "@tensorflow/tfjs-backend-wasm";

import * as faceapi from "@vladmandic/face-api/dist/face-api.node-wasm.js";

import jpeg from "jpeg-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================
// PATHS
// =========================================

const BACKEND_ROOT = path.resolve(__dirname, "../..");
const MODEL_PATH = path.join(BACKEND_ROOT, "models", "faceapi");

let initialized = false;

// =========================================
// PD ESTIMATION CONSTANTS
// =========================================

/*
 * These values are calibration assumptions used
 * only for an eyewear-recommendation estimate.
 *
 * They are NOT clinical measurements.
 */

const REFERENCE_FACE_WIDTH_MM = 140;

const MIN_ESTIMATED_PD_MM = 54;
const MAX_ESTIMATED_PD_MM = 76;

const REFERENCE_EYE_TO_FACE_RATIO = 0.43;

// =========================================
// INITIALIZE FACE API
// =========================================

const initializeFaceApi = async () => {
  if (initialized) {
    return;
  }

  const wasmPath = path.join(
    BACKEND_ROOT,
    "node_modules",
    "@tensorflow",
    "tfjs-backend-wasm",
    "dist",
  );

  const wasmFiles = {
    "tfjs-backend-wasm.wasm": path.join(wasmPath, "tfjs-backend-wasm.wasm"),

    "tfjs-backend-wasm-simd.wasm": path.join(
      wasmPath,
      "tfjs-backend-wasm-simd.wasm",
    ),

    "tfjs-backend-wasm-threaded-simd.wasm": path.join(
      wasmPath,
      "tfjs-backend-wasm-threaded-simd.wasm",
    ),
  };

  // Verify WASM files.
  for (const [name, filePath] of Object.entries(wasmFiles)) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing WASM file: ${filePath}`);
    }

    console.log(`WASM file found: ${name}`);
  }

  wasm.setWasmPaths(wasmFiles);

  const backendSet = await tf.setBackend("wasm");

  if (!backendSet) {
    throw new Error("Unable to initialize TensorFlow WASM backend.");
  }

  await tf.ready();

  if (tf.getBackend() !== "wasm") {
    throw new Error(`Unexpected TensorFlow backend: ${tf.getBackend()}`);
  }

  await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_PATH);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);

  initialized = true;

  console.log("Face analysis service initialized.");
  console.log("TensorFlow backend:", tf.getBackend());
};

// =========================================
// ROTATE IMAGE
// =========================================

const rotateImageData = (decoded, rotation) => {
  const { width, height, data } = decoded;

  if (rotation === 0) {
    return {
      width,
      height,
      data,
    };
  }

  const rotatedWidth = rotation === 90 || rotation === 270 ? height : width;

  const rotatedHeight = rotation === 90 || rotation === 270 ? width : height;

  const rotated = new Uint8Array(rotatedWidth * rotatedHeight * 4);

  const setPixel = (sourceX, sourceY, targetX, targetY) => {
    const sourceIndex = (sourceY * width + sourceX) * 4;

    const targetIndex = (targetY * rotatedWidth + targetX) * 4;

    rotated[targetIndex] = data[sourceIndex];
    rotated[targetIndex + 1] = data[sourceIndex + 1];
    rotated[targetIndex + 2] = data[sourceIndex + 2];
    rotated[targetIndex + 3] = data[sourceIndex + 3];
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rotation === 90) {
        setPixel(x, y, height - 1 - y, x);
      } else if (rotation === 180) {
        setPixel(x, y, width - 1 - x, height - 1 - y);
      } else if (rotation === 270) {
        setPixel(x, y, y, width - 1 - x);
      }
    }
  }

  return {
    width: rotatedWidth,
    height: rotatedHeight,
    data: rotated,
  };
};

// =========================================
// RGBA -> RGB TENSOR
// =========================================

const decodedToTensor = (decoded) => {
  const { width, height, data } = decoded;

  const rgbData = new Int32Array(width * height * 3);

  for (let index = 0; index < width * height; index++) {
    const sourceIndex = index * 4;
    const targetIndex = index * 3;

    rgbData[targetIndex] = data[sourceIndex];
    rgbData[targetIndex + 1] = data[sourceIndex + 1];
    rgbData[targetIndex + 2] = data[sourceIndex + 2];
  }

  return tf.tensor3d(rgbData, [height, width, 3], "int32");
};

// =========================================
// POINT HELPERS
// =========================================

const point = (x, y) => ({
  x,
  y,
});

const distance = (first, second) => {
  const dx = first.x - second.x;
  const dy = first.y - second.y;

  return Math.sqrt(dx * dx + dy * dy);
};

const averagePoint = (points) => {
  if (!points.length) {
    return null;
  }

  const total = points.reduce(
    (sum, current) => ({
      x: sum.x + current.x,
      y: sum.y + current.y,
    }),
    {
      x: 0,
      y: 0,
    },
  );

  return point(total.x / points.length, total.y / points.length);
};

const distancePointToPointSet = (first, second) => distance(first, second);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const round = (value, decimals = 2) => {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
};

// =========================================
// WIDTH OF A POINT SET
// =========================================

const horizontalWidth = (points) => {
  if (!points.length) {
    return 0;
  }

  let minX = Infinity;
  let maxX = -Infinity;

  for (const current of points) {
    if (current.x < minX) {
      minX = current.x;
    }

    if (current.x > maxX) {
      maxX = current.x;
    }
  }

  return maxX - minX;
};

// =========================================
// LANDMARK EXTRACTION
// =========================================

const extractMeasurements = (detection) => {
  const positions = detection.landmarks.positions;

  if (!positions || positions.length !== 68) {
    throw new Error(
      `Expected 68 landmarks but received ${positions?.length || 0}.`,
    );
  }

  const points = positions.map((item) => point(item.x, item.y));

  /*
   * Standard 68-point layout:
   *
   * 0-16   jaw
   * 17-21  left eyebrow
   * 22-26  right eyebrow
   * 27-35  nose
   * 36-41  left eye
   * 42-47  right eye
   * 48-67  mouth
   */

  const jaw = points.slice(0, 17);

  const leftEyebrow = points.slice(17, 22);
  const rightEyebrow = points.slice(22, 27);

  const nose = points.slice(27, 36);

  const leftEye = points.slice(36, 42);
  const rightEye = points.slice(42, 48);

  // =========================================
  // EYE CENTERS
  // =========================================

  const eyeCenterLeft = averagePoint(leftEye);
  const eyeCenterRight = averagePoint(rightEye);

  if (!eyeCenterLeft || !eyeCenterRight) {
    throw new Error("Unable to determine eye centers.");
  }

  const eyeCenterDistance = distancePointToPointSet(
    eyeCenterLeft,
    eyeCenterRight,
  );

  if (eyeCenterDistance <= 0) {
    throw new Error("Invalid eye center distance.");
  }

  // Average eye center.
  const eyeCenter = averagePoint([eyeCenterLeft, eyeCenterRight]);

  // =========================================
  // FACE WIDTHS
  // =========================================

  const jawWidth = distance(jaw[0], jaw[16]);

  const cheekWidth = distance(jaw[3], jaw[13]);

  const lowerCheekWidth = distance(jaw[5], jaw[11]);

  const foreheadWidth = distance(leftEyebrow[0], rightEyebrow[4]);

  const eyebrowWidth = horizontalWidth([...leftEyebrow, ...rightEyebrow]);

  /*
   * Keep the existing physical-width behavior.
   *
   * This is used for the estimated mm scale.
   */
  const faceWidthPixels = Math.max(jawWidth, cheekWidth, foreheadWidth);

  if (faceWidthPixels <= 0) {
    throw new Error("Unable to determine face width.");
  }

  // =========================================
  // FACE HEIGHT
  // =========================================

  const faceBox = detection.detection.box;

  const faceBoxHeight = faceBox.height;

  const browCenterLeft = averagePoint(leftEyebrow);

  const browCenterRight = averagePoint(rightEyebrow);

  const browCenter = averagePoint([browCenterLeft, browCenterRight]);

  const chin = jaw[8];

  /*
   * Original landmark-based measurement.
   *
   * This remains for the estimated face-length
   * field so existing UI/database behavior
   * stays compatible.
   */
  const landmarkFaceLengthPixels =
    browCenter && chin ? distance(browCenter, chin) : faceBoxHeight;

  const faceLengthPixels = Math.max(
    landmarkFaceLengthPixels,
    faceBoxHeight * 0.75,
  );

  // =========================================
  // ORIGINAL FACIAL RATIOS
  // =========================================

  const lengthToWidthRatio = faceLengthPixels / Math.max(faceWidthPixels, 1);

  const foreheadToCheekRatio = foreheadWidth / Math.max(cheekWidth, 1);

  const foreheadToJawRatio = foreheadWidth / Math.max(jawWidth, 1);

  const cheekToJawRatio = cheekWidth / Math.max(jawWidth, 1);

  const lowerCheekToJawRatio = lowerCheekWidth / Math.max(jawWidth, 1);

  // =========================================
  // IMPROVED FACE-SHAPE GEOMETRY
  // =========================================

  /*
   * IMPORTANT:
   *
   * The 68-point landmark model has no true
   * hairline/forehead landmark.
   *
   * The previous classifier therefore relied too
   * heavily on brow-to-chin distance and the
   * widest facial landmark. That can cause a
   * visibly elongated face to appear artificially
   * round.
   *
   * For shape classification we use a separate
   * geometry model:
   *
   *   - cheek width is given greater importance
   *   - jaw width is retained as secondary evidence
   *   - forehead width contributes modestly
   *   - detector face height contributes strongly
   *   - brow-to-chin provides landmark evidence
   *   - forehead extension is estimated from the
   *     eyebrow-to-eye vertical gap
   *
   * These values are heuristic and are NOT
   * clinical measurements.
   */

  const eyebrowToEyeGap =
    browCenter && eyeCenter ? Math.abs(browCenter.y - eyeCenter.y) : 0;

  const browToChinDistance =
    browCenter && chin ? Math.abs(chin.y - browCenter.y) : faceBoxHeight;

  /*
   * There is no hairline landmark.
   *
   * Estimate the upper-face region above the
   * eyebrows using the eye/brow spacing.
   */
  const estimatedForeheadExtension = Math.max(
    eyebrowToEyeGap * 1.5,
    faceBoxHeight * 0.08,
  );

  const landmarkShapeLength = browToChinDistance + estimatedForeheadExtension;

  /*
   * Robust shape width.
   *
   * Cheek width is the primary width because
   * jaw endpoints can overstate perceived facial
   * width in a front-facing image.
   */
  const shapeWidthPixels =
    cheekWidth * 0.65 + jawWidth * 0.2 + foreheadWidth * 0.15;

  /*
   * Blend the detector's full vertical face extent
   * with landmark-derived height.
   */
  const shapeLengthPixels = faceBoxHeight * 0.6 + landmarkShapeLength * 0.4;

  const shapeLengthToWidthRatio =
    shapeLengthPixels / Math.max(shapeWidthPixels, 1);

  // =========================================
  // ESTIMATE PHYSICAL FACE WIDTH
  // =========================================

  /*
   * The camera image has no absolute physical
   * scale. We therefore use a configurable
   * reference width.
   */

  const estimatedFaceWidth = REFERENCE_FACE_WIDTH_MM;

  const pixelsPerMillimeter = faceWidthPixels / estimatedFaceWidth;

  // =========================================
  // PD ESTIMATION
  // =========================================

  /*
   * The 68-point model does not give true pupil
   * centers, so this remains an estimate.
   */

  const eyeToFaceRatio = eyeCenterDistance / Math.max(faceWidthPixels, 1);

  const referenceEyeDistanceMm =
    REFERENCE_FACE_WIDTH_MM * REFERENCE_EYE_TO_FACE_RATIO;

  let estimatedPd =
    referenceEyeDistanceMm * (eyeToFaceRatio / REFERENCE_EYE_TO_FACE_RATIO);

  estimatedPd = clamp(estimatedPd, MIN_ESTIMATED_PD_MM, MAX_ESTIMATED_PD_MM);

  estimatedPd = Math.round(estimatedPd);

  // =========================================
  // ESTIMATE FACE LENGTH
  // =========================================

  const estimatedFaceLength = clamp(
    Math.round(faceLengthPixels / pixelsPerMillimeter),
    50,
    300,
  );

  // =========================================
  // FACE SHAPE
  // =========================================

  const shapeResult = classifyFaceShape({
    shapeLengthToWidthRatio,
    foreheadToCheekRatio,
    foreheadToJawRatio,
    cheekToJawRatio,
    lowerCheekToJawRatio,
    jawWidth,
    cheekWidth,
    foreheadWidth,
  });

  // =========================================
  // CONFIDENCE
  // =========================================

  const confidence = calculateConfidence({
    detection,
    eyeCenterDistance,
    faceWidthPixels,
    faceLengthPixels,
    shapeResult,
  });

  return {
    faceShape: shapeResult.faceShape,

    pupilDistance: estimatedPd,

    faceWidth: clamp(Math.round(estimatedFaceWidth), 50, 300),

    faceLength: estimatedFaceLength,

    confidence,

    debug: {
      detectionScore: round(detection.detection.score, 4),

      faceBox: {
        x: round(faceBox.x),
        y: round(faceBox.y),
        width: round(faceBox.width),
        height: round(faceBox.height),
      },

      eyeCenterDistancePixels: round(eyeCenterDistance),

      faceWidthPixels: round(faceWidthPixels),

      jawWidthPixels: round(jawWidth),

      cheekWidthPixels: round(cheekWidth),

      foreheadWidthPixels: round(foreheadWidth),

      faceLengthPixels: round(faceLengthPixels),

      // New shape-analysis debug values.
      shapeWidthPixels: round(shapeWidthPixels),

      shapeLengthPixels: round(shapeLengthPixels),

      eyebrowToEyeGapPixels: round(eyebrowToEyeGap),

      browToChinDistancePixels: round(browToChinDistance),

      estimatedForeheadExtensionPixels: round(estimatedForeheadExtension),

      shapeLengthToWidthRatio: round(shapeLengthToWidthRatio, 4),

      eyeToFaceRatio: round(eyeToFaceRatio, 4),

      // Existing measurement ratio retained.
      lengthToWidthRatio: round(lengthToWidthRatio, 4),

      foreheadToCheekRatio: round(foreheadToCheekRatio, 4),

      foreheadToJawRatio: round(foreheadToJawRatio, 4),

      cheekToJawRatio: round(cheekToJawRatio, 4),

      lowerCheekToJawRatio: round(lowerCheekToJawRatio, 4),

      estimatedPd,

      pixelsPerMillimeter: round(pixelsPerMillimeter, 4),

      shapeScores: shapeResult.scores,
    },
  };
};

// =========================================
// FACE SHAPE CLASSIFICATION
// =========================================

/*
 * Converts a measured value into a 0..1 similarity
 * score around a desired target.
 *
 * Example:
 *   value  = 1.35
 *   target = 1.35
 *   tolerance = 0.25
 *   => 1.0
 */
const closeness = (value, target, tolerance) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const difference = Math.abs(value - target);

  return clamp(1 - difference / tolerance, 0, 1);
};

const classifyFaceShape = ({
  shapeLengthToWidthRatio,
  foreheadToCheekRatio,
  foreheadToJawRatio,
  cheekToJawRatio,
  lowerCheekToJawRatio,
  jawWidth,
  cheekWidth,
  foreheadWidth,
}) => {
  /*
   * Heuristic eyewear face-shape classifier.
   *
   * The scores describe similarity to the four
   * VisionFit categories:
   *
   *   OVAL
   *   ROUND
   *   SQUARE
   *   HEART
   *
   * This is not a medical or optometry classifier.
   */

  const jawToCheek = jawWidth / Math.max(cheekWidth, 1);

  const foreheadToCheek = foreheadWidth / Math.max(cheekWidth, 1);

  const scores = {
    OVAL: 0,
    ROUND: 0,
    SQUARE: 0,
    HEART: 0,
  };

  // =========================================
  // OVAL
  // =========================================

  /*
   * Oval faces are generally:
   *
   *   - longer than wide
   *   - moderately tapered
   *   - not dominated by a very wide forehead
   *   - not dominated by a very broad square jaw
   */

  scores.OVAL =
    closeness(shapeLengthToWidthRatio, 1.35, 0.25) * 0.45 +
    closeness(lowerCheekToJawRatio, 0.78, 0.16) * 0.2 +
    closeness(foreheadToJawRatio, 0.9, 0.22) * 0.15 +
    closeness(cheekToJawRatio, 0.92, 0.15) * 0.1 +
    closeness(foreheadToCheek, 0.95, 0.15) * 0.1;

  // =========================================
  // ROUND
  // =========================================

  /*
   * Round faces should have:
   *
   *   - a relatively low height/width ratio
   *   - less downward taper
   *   - balanced upper/lower widths
   */

  scores.ROUND =
    closeness(shapeLengthToWidthRatio, 1.1, 0.18) * 0.5 +
    closeness(lowerCheekToJawRatio, 0.86, 0.14) * 0.15 +
    closeness(foreheadToJawRatio, 0.98, 0.16) * 0.15 +
    closeness(cheekToJawRatio, 0.96, 0.12) * 0.1 +
    closeness(foreheadToCheek, 1.0, 0.14) * 0.1;

  // =========================================
  // SQUARE
  // =========================================

  /*
   * Square faces should have:
   *
   *   - moderate height/width
   *   - similar forehead and jaw widths
   *   - stronger jaw width
   *   - less taper toward the chin
   */

  scores.SQUARE =
    closeness(shapeLengthToWidthRatio, 1.15, 0.18) * 0.35 +
    closeness(foreheadToJawRatio, 1.0, 0.14) * 0.25 +
    closeness(jawToCheek, 1.04, 0.14) * 0.15 +
    closeness(foreheadToCheek, 1.0, 0.14) * 0.15 +
    closeness(lowerCheekToJawRatio, 0.82, 0.14) * 0.1;

  // =========================================
  // HEART
  // =========================================

  /*
   * Heart-shaped faces should have:
   *
   *   - a wider upper face
   *   - forehead noticeably wider than jaw
   *   - stronger lower-face taper
   */

  scores.HEART =
    closeness(shapeLengthToWidthRatio, 1.3, 0.25) * 0.35 +
    closeness(foreheadToJawRatio, 1.18, 0.2) * 0.3 +
    closeness(foreheadToCheek, 1.08, 0.18) * 0.15 +
    closeness(lowerCheekToJawRatio, 0.68, 0.14) * 0.2;

  // =========================================
  // NORMALIZE
  // =========================================

  const maxScore = Math.max(...Object.values(scores));

  if (maxScore <= 0) {
    return {
      faceShape: "OVAL",
      scores,
    };
  }

  const normalizedScores = Object.fromEntries(
    Object.entries(scores).map(([shape, score]) => [
      shape,
      round(score / maxScore, 2),
    ]),
  );

  const faceShape = Object.entries(scores).sort(
    ([, first], [, second]) => second - first,
  )[0][0];

  return {
    faceShape,
    scores: normalizedScores,
  };
};

// =========================================
// CONFIDENCE
// =========================================

const calculateConfidence = ({
  detection,
  eyeCenterDistance,
  faceWidthPixels,
  faceLengthPixels,
  shapeResult,
}) => {
  let confidence = detection.detection.score;

  // Strong eye geometry.
  if (eyeCenterDistance > 30) {
    confidence += 0.02;
  }

  // Sufficient horizontal geometry.
  if (faceWidthPixels > 100) {
    confidence += 0.02;
  }

  // Sufficient vertical geometry.
  if (faceLengthPixels > 100) {
    confidence += 0.01;
  }

  /*
   * Penalize ambiguous shape results.
   *
   * We use normalized scores so the difference
   * between the first and second candidate can
   * be evaluated consistently.
   */

  const sortedScores = Object.values(shapeResult.scores).sort((a, b) => b - a);

  if (sortedScores.length >= 2) {
    const separation = sortedScores[0] - sortedScores[1];

    if (separation < 0.1) {
      confidence -= 0.08;
    } else if (separation < 0.2) {
      confidence -= 0.04;
    } else {
      confidence += 0.02;
    }
  }

  return clamp(round(confidence, 2), 0, 0.99);
};

// =========================================
// PUBLIC ANALYSIS FUNCTION
// =========================================

export const analyzeFaceImage = async (imageBuffer) => {
  await initializeFaceApi();

  if (!Buffer.isBuffer(imageBuffer)) {
    throw new Error("Face analysis expects an image Buffer.");
  }

  let decoded;

  try {
    decoded = jpeg.decode(imageBuffer, {
      useTArray: true,
    });
  } catch (error) {
    throw new Error(`Unable to decode JPEG image: ${error.message}`);
  }

  if (!decoded || !decoded.data || !decoded.width || !decoded.height) {
    throw new Error("Unable to decode image.");
  }

  console.log("Decoded image:", `${decoded.width} x ${decoded.height}`);

  // =======================================
  // TRY FOUR ORIENTATIONS
  // =======================================

  const rotations = [0, 90, 180, 270];

  for (const rotation of rotations) {
    let tensor = null;

    try {
      console.log(`Trying face detection at ${rotation}°...`);

      const oriented = rotateImageData(decoded, rotation);

      tensor = decodedToTensor(oriented);

      const detection = await faceapi
        .detectSingleFace(
          tensor,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.5,
          }),
        )
        .withFaceLandmarks();

      if (!detection) {
        console.log(`No face detected at ${rotation}°`);

        continue;
      }

      console.log(`Face detected at ${rotation}°`);

      console.log("Detection score:", detection.detection.score);

      const measurements = extractMeasurements(detection);

      return {
        ...measurements,

        debug: {
          ...measurements.debug,

          detectedRotation: rotation,
        },
      };
    } catch (error) {
      console.error(`Face analysis failed at ${rotation}°:`, error.message);
    } finally {
      if (tensor) {
        tensor.dispose();
      }
    }
  }

  throw new Error(
    "No face detected. Please face the camera directly, make sure your entire face is visible, and try again.",
  );
};

// =========================================
// TEST HELPER
// =========================================

export const analyzeFaceImageFile = async (imagePath) => {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  const imageBuffer = fs.readFileSync(imagePath);

  return analyzeFaceImage(imageBuffer);
};
