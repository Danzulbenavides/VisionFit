import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import * as tf from "@tensorflow/tfjs";
import * as wasm from "@tensorflow/tfjs-backend-wasm";
import * as faceapi from "@vladmandic/face-api/dist/face-api.node-wasm.js";

const BACKEND_ROOT = path.resolve(process.cwd());

const MODEL_PATH = path.join(BACKEND_ROOT, "models", "faceapi");

let initialized = false;

// =========================================
// CONFIGURATION
// =========================================

const MAX_INPUT_WIDTH = 1200;
const MAX_FRAME_ASSET_BYTES = 5 * 1024 * 1024;

const FRAME_TO_FACE_WIDTH_RATIO = 1;

const FALLBACK_FRAME_TO_EYE_RATIO = 2.25;

const FRAME_VERTICAL_OFFSET_RATIO = 0.04;

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

  for (const [name, filePath] of Object.entries(wasmFiles)) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing WASM file: ${filePath}`);
    }

    console.log(`VTO WASM file found: ${name}`);
  }

  wasm.setWasmPaths(wasmFiles);

  const backendSet = await tf.setBackend("wasm");

  if (!backendSet) {
    throw new Error(
      "Unable to initialize TensorFlow WASM backend for Virtual Try-On.",
    );
  }

  await tf.ready();

  if (tf.getBackend() !== "wasm") {
    throw new Error(`Unexpected TensorFlow backend: ${tf.getBackend()}`);
  }

  await faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_PATH);

  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);

  initialized = true;

  console.log("Virtual Try-On face analysis initialized.");

  console.log("Virtual Try-On TensorFlow backend:", tf.getBackend());
};

// =========================================
// HELPERS
// =========================================

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const distance = (first, second) => {
  const dx = first.x - second.x;

  const dy = first.y - second.y;

  return Math.sqrt(dx * dx + dy * dy);
};

const averagePoint = (points) => {
  if (!Array.isArray(points) || points.length === 0) {
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

  return {
    x: total.x / points.length,

    y: total.y / points.length,
  };
};

// =========================================
// IMAGE -> TENSOR
// =========================================

const imageToTensor = (rawBuffer, width, height, channels) => {
  const rgbData = new Int32Array(width * height * 3);

  for (let index = 0; index < width * height; index++) {
    const sourceIndex = index * channels;

    const targetIndex = index * 3;

    rgbData[targetIndex] = rawBuffer[sourceIndex];

    rgbData[targetIndex + 1] = rawBuffer[sourceIndex + 1];

    rgbData[targetIndex + 2] = rawBuffer[sourceIndex + 2];
  }

  return tf.tensor3d(rgbData, [height, width, 3], "int32");
};

// =========================================
// RESOLVE TRY-ON ASSET
// =========================================

function resolveLocalTryOnPath(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const raw = value.trim();

  if (!raw) {
    return null;
  }

  // Absolute Windows/Linux path
  if (path.isAbsolute(raw) && !raw.startsWith("/uploads/")) {
    return raw;
  }

  // Convert URL-style upload paths such as:
  // /uploads/try-on/visionfit-test-frame.png
  // into:
  // <backend>/uploads/try-on/visionfit-test-frame.png
  let relativePath = raw;

  if (relativePath.startsWith("/")) {
    relativePath = relativePath.slice(1);
  }

  if (relativePath.startsWith("uploads/")) {
    return path.join(BACKEND_ROOT, relativePath);
  }

  // Also support:
  // uploads/try-on/visionfit-test-frame.png
  if (relativePath.startsWith("uploads\\")) {
    return path.join(BACKEND_ROOT, relativePath);
  }

  // Fallback for paths relative to backend
  return path.join(BACKEND_ROOT, relativePath);
}

const fetchRemoteTryOnAsset = async (url) => {
  const controller = new AbortController();

  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Unable to download try-on frame asset. HTTP ${response.status}.`,
      );
    }

    const contentLength = Number(response.headers.get("content-length") || 0);

    if (contentLength > MAX_FRAME_ASSET_BYTES) {
      throw new Error("Try-on frame asset is too large.");
    }

    const arrayBuffer = await response.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > MAX_FRAME_ASSET_BYTES) {
      throw new Error("Try-on frame asset exceeds the 5 MB limit.");
    }

    return buffer;
  } finally {
    clearTimeout(timeout);
  }
};

const getTryOnAssetBuffer = async (tryOnImage) => {
  if (!tryOnImage || typeof tryOnImage !== "string") {
    throw new Error("This product does not have a Virtual Try-On frame asset.");
  }

  // =====================================
  // DATA URI
  // =====================================

  if (tryOnImage.startsWith("data:image/")) {
    const commaIndex = tryOnImage.indexOf(",");

    if (commaIndex === -1) {
      throw new Error("Invalid try-on image data.");
    }

    const base64 = tryOnImage.slice(commaIndex + 1);

    const buffer = Buffer.from(base64, "base64");

    if (buffer.length > MAX_FRAME_ASSET_BYTES) {
      throw new Error("Try-on frame asset is too large.");
    }

    return buffer;
  }

  // =====================================
  // HTTP / HTTPS
  // =====================================

  if (/^https?:\/\//i.test(tryOnImage)) {
    return fetchRemoteTryOnAsset(tryOnImage);
  }

  // =====================================
  // LOCAL FILE
  // =====================================

  const localPath = resolveLocalTryOnPath(tryOnImage);

  if (!localPath) {
    throw new Error(`Try-on frame asset was not found: ${tryOnImage}`);
  }

  const stats = fs.statSync(localPath);

  if (stats.size > MAX_FRAME_ASSET_BYTES) {
    throw new Error("Try-on frame asset exceeds the 5 MB limit.");
  }

  return fs.readFileSync(localPath);
};

// =========================================
// PREPARE USER IMAGE
// =========================================

const prepareUserImage = async (imageBuffer) => {
  /*
   * .rotate()
   *
   * Automatically applies EXIF orientation.
   *
   * This avoids the orientation problem we
   * previously had with jpeg-js.
   */

  const result = await sharp(imageBuffer, {
    limitInputPixels: 40_000_000,
  })
    .rotate()
    .resize({
      width: MAX_INPUT_WIDTH,
      height: MAX_INPUT_WIDTH,
      fit: "inside",
      withoutEnlargement: true,
    })
    .removeAlpha()
    .raw()
    .toBuffer({
      resolveWithObject: true,
    });

  return result;
};

// =========================================
// DETECT USER FACE
// =========================================

const detectFace = async (rawImage, width, height, channels) => {
  const tensor = imageToTensor(rawImage, width, height, channels);

  try {
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
      throw new Error(
        "No face detected. Please take a clear front-facing photo with your entire face visible.",
      );
    }

    return detection;
  } finally {
    tensor.dispose();
  }
};

// =========================================
// EXTRACT VTO GEOMETRY
// =========================================

const extractTryOnGeometry = (detection) => {
  const positions = detection.landmarks.positions;

  if (!positions || positions.length !== 68) {
    throw new Error(
      `Expected 68 face landmarks but received ${positions?.length || 0}.`,
    );
  }

  const points = positions.map((item) => ({
    x: item.x,
    y: item.y,
  }));

  const jaw = points.slice(0, 17);

  const leftEye = points.slice(36, 42);

  const rightEye = points.slice(42, 48);

  const eyeCenterLeft = averagePoint(leftEye);

  const eyeCenterRight = averagePoint(rightEye);

  if (!eyeCenterLeft || !eyeCenterRight) {
    throw new Error("Unable to determine eye positions.");
  }

  const eyeCenter = averagePoint([eyeCenterLeft, eyeCenterRight]);

  const eyeDistance = distance(eyeCenterLeft, eyeCenterRight);

  const faceWidth = distance(jaw[0], jaw[16]);

  const faceBox = detection.detection.box;

  if (eyeDistance <= 0 || faceWidth <= 0) {
    throw new Error("Unable to determine facial geometry for Virtual Try-On.");
  }

  return {
    eyeCenterLeft,
    eyeCenterRight,
    eyeCenter,
    eyeDistance,
    faceWidth,
    faceBox,
    detectionScore: detection.detection.score,
  };
};

// =========================================
// PREPARE FRAME ASSET
// =========================================

async function prepareFrameAsset(input) {
  const buffer = await resolveTryOnImageBuffer(input);

  const metadata = await sharp(buffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Invalid Virtual Try-On frame image.");
  }

  if (metadata.hasAlpha !== true) {
    throw new Error(
      "Virtual Try-On frame must be a transparent PNG or WebP with an alpha channel.",
    );
  }

  // Trim transparent borders around the actual glasses.
  const trimmed = await sharp(buffer)
    .ensureAlpha()
    .trim({
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const trimmedMetadata = await sharp(trimmed).metadata();

  return {
    buffer: trimmed,
    width: trimmedMetadata.width,
    height: trimmedMetadata.height,
  };
}

async function resolveTryOnImageBuffer(value) {
  if (!value || typeof value !== "string") {
    throw new Error("Virtual Try-On image is not configured.");
  }

  const raw = value.trim();

  if (!raw) {
    throw new Error("Virtual Try-On image is not configured.");
  }

  // HTTP / HTTPS image URL
  if (/^https?:\/\//i.test(raw)) {
    const response = await fetch(raw);

    if (!response.ok) {
      throw new Error(
        `Unable to load Virtual Try-On image: HTTP ${response.status}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > MAX_FRAME_ASSET_BYTES) {
      throw new Error(
        `Virtual Try-On image exceeds the ${MAX_FRAME_ASSET_BYTES} byte limit.`,
      );
    }

    return buffer;
  }

  // Local file
  const localPath = resolveLocalTryOnPath(raw);

  if (!localPath) {
    throw new Error("Invalid Virtual Try-On image path.");
  }

  const stats = await fsPromises.stat(localPath);

  if (!stats.isFile()) {
    throw new Error("Virtual Try-On image path is not a file.");
  }

  if (stats.size > MAX_FRAME_ASSET_BYTES) {
    throw new Error(
      `Virtual Try-On image exceeds the ${MAX_FRAME_ASSET_BYTES} byte limit.`,
    );
  }

  return await fsPromises.readFile(localPath);
}

// =========================================
// CALCULATE FRAME SIZE
// =========================================

const calculateFrameDimensions = ({ geometry, frameMetadata, product }) => {
  const originalWidth = frameMetadata.width;

  const originalHeight = frameMetadata.height;

  const productFrameWidth = Number(product?.size?.frameWidth);

  const userFaceWidth = geometry.faceWidth;

  let targetWidth;

  /*
   * Preferred method:
   *
   * Product frame width / estimated
   * user face width.
   *
   * Example:
   *
   * product = 126 mm
   * user = 140 mm
   * ratio = 0.90
   *
   * This uses the actual product's
   * dimensions instead of a fixed
   * frame size.
   */

  if (
    Number.isFinite(productFrameWidth) &&
    productFrameWidth > 0 &&
    userFaceWidth > 0
  ) {
    targetWidth =
      userFaceWidth * (productFrameWidth / 140) * FRAME_TO_FACE_WIDTH_RATIO;
  } else {
    /*
     * Fallback:
     *
     * Estimate frame width from the
     * distance between the eyes.
     */

    targetWidth = geometry.eyeDistance * FALLBACK_FRAME_TO_EYE_RATIO;
  }

  const productScale = Number(product?.tryOnScale);

  const safeScale =
    Number.isFinite(productScale) && productScale > 0 ? productScale : 1;

  targetWidth *= safeScale;

  targetWidth = clamp(Math.round(targetWidth), 80, 1000);

  const aspectRatio = originalHeight / Math.max(originalWidth, 1);

  const targetHeight = Math.max(1, Math.round(targetWidth * aspectRatio));

  return {
    width: targetWidth,

    height: targetHeight,

    sourceWidth: originalWidth,

    sourceHeight: originalHeight,
  };
};

// =========================================
// CALCULATE FRAME POSITION
// =========================================

const calculateFramePosition = ({
  geometry,
  frameWidth,
  frameHeight,
  imageWidth,
  imageHeight,
  product,
}) => {
  /*
   * Horizontal center:
   *
   * place frame center between both eye
   * centers.
   */

  const eyeMidX = geometry.eyeCenter.x;

  const eyeLineY = geometry.eyeCenter.y;

  /*
   * Frame center is slightly above the
   * eye line so the eyes sit naturally
   * inside the lenses.
   */

  const defaultVerticalOffset = frameHeight * FRAME_VERTICAL_OFFSET_RATIO;

  const productOffsetX = Number(product?.tryOnOffsetX);

  const productOffsetY = Number(product?.tryOnOffsetY);

  const offsetX = Number.isFinite(productOffsetX) ? productOffsetX : 0;

  const offsetY = Number.isFinite(productOffsetY) ? productOffsetY : 0;

  let left = Math.round(eyeMidX - frameWidth / 2 + offsetX);

  let top = Math.round(
    eyeLineY - frameHeight / 2 + defaultVerticalOffset + offsetY,
  );

  /*
   * Keep the overlay inside the image.
   */

  left = clamp(left, 0, Math.max(0, imageWidth - frameWidth));

  top = clamp(top, 0, Math.max(0, imageHeight - frameHeight));

  return {
    left,
    top,
  };
};

// =========================================
// COMPOSITE TRY-ON
// =========================================

export const createVirtualTryOn = async ({ imageBuffer, product }) => {
  await initializeFaceApi();

  if (!Buffer.isBuffer(imageBuffer)) {
    throw new Error("Virtual Try-On expects an image Buffer.");
  }

  if (!product) {
    throw new Error("A product is required for Virtual Try-On.");
  }

  if (!product.tryOnImage) {
    throw new Error("This product is not configured for Virtual Try-On yet.");
  }

  console.log("VTO: preparing user image...");

  const prepared = await prepareUserImage(imageBuffer);

  const { data, info } = prepared;

  console.log("VTO: prepared image", `${info.width} x ${info.height}`);

  console.log("VTO: detecting face...");

  const detection = await detectFace(
    data,
    info.width,
    info.height,
    info.channels,
  );

  console.log("VTO: face detection score:", detection.detection.score);

  const geometry = extractTryOnGeometry(detection);

  console.log("VTO: eye distance:", geometry.eyeDistance);

  console.log("VTO: face width:", geometry.faceWidth);

  console.log("VTO: downloading/loading frame asset...");

  const frameAsset = await prepareFrameAsset(product.tryOnImage);

  console.log("VTO: trimmed frame asset:", {
    width: frameAsset.width,
    height: frameAsset.height,
  });

  const frameMetadata = {
    width: frameAsset.width,
    height: frameAsset.height,
  };

  const dimensions = calculateFrameDimensions({
    geometry,
    frameMetadata,
    product,
  });

  console.log("VTO: frame dimensions:", dimensions);

  const resizedFrame = await sharp(frameAsset.buffer)
    .resize({
      width: dimensions.width,
      height: dimensions.height,
      fit: "fill",
    })
    .png()
    .toBuffer();

  const position = calculateFramePosition({
    geometry,

    frameWidth: dimensions.width,

    frameHeight: dimensions.height,

    imageWidth: info.width,

    imageHeight: info.height,

    product,
  });

  console.log("VTO: frame position:", position);

  /*
   * Recreate a clean RGB photo from the
   * normalized raw input.
   */

  const baseImage = await sharp(data, {
    raw: {
      width: info.width,

      height: info.height,

      channels: info.channels,
    },
  })
    .jpeg({
      quality: 88,
    })
    .toBuffer();

  /*
   * Composite transparent frame onto
   * the user's face.
   */

  const resultBuffer = await sharp(baseImage)
    .composite([
      {
        input: resizedFrame,

        left: position.left,

        top: position.top,
      },
    ])
    .jpeg({
      quality: 88,
      mozjpeg: true,
    })
    .toBuffer();

  console.log("VTO: composition complete.");

  return {
    imageBuffer: resultBuffer,

    mimeType: "image/jpeg",

    width: info.width,

    height: info.height,

    detectionScore: Number(detection.detection.score.toFixed(4)),

    frame: {
      width: dimensions.width,

      height: dimensions.height,

      left: position.left,

      top: position.top,
    },

    face: {
      eyeDistance: Math.round(geometry.eyeDistance),

      faceWidth: Math.round(geometry.faceWidth),

      eyeCenter: {
        x: Math.round(geometry.eyeCenter.x),

        y: Math.round(geometry.eyeCenter.y),
      },
    },
  };
};
