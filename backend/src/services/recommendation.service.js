// =========================================
// VISIONFIT RECOMMENDATION SERVICE
// =========================================

/*
 * Recommendation system:
 *
 * 1. Face shape compatibility   = 50 points
 * 2. Frame width / fit          = 20 points
 * 3. Prescription compatibility = 20 points
 * 4. Stock availability         = 10 points
 *
 * Maximum = 100 points
 *
 * This is a recommendation heuristic,
 * not a medical or clinical fitting system.
 */

// =========================================
// FACE SHAPE → FRAME SHAPE MAPPING
// =========================================

const FACE_SHAPE_COMPATIBILITY = {
  /*
   * Oval
   * Balanced proportions generally allow
   * several frame geometries.
   */
  OVAL: ["RECTANGLE", "SQUARE", "BROWLINE", "AVIATOR"],

  /*
   * Round
   * Angular frames provide visual contrast.
   */
  ROUND: ["RECTANGLE", "SQUARE", "BROWLINE", "GEOMETRIC"],

  /*
   * Square
   * Softer/rounded shapes provide contrast.
   */
  SQUARE: ["ROUND", "OVAL", "AVIATOR", "BROWLINE"],

  /*
   * Heart
   * Softer and balanced lower-face shapes.
   */
  HEART: ["ROUND", "OVAL", "AVIATOR", "CAT_EYE"],
};

// =========================================
// FRAME SHAPE RANKING
// =========================================

/*
 * First shape = strongest match.
 *
 * The first shape receives the largest score.
 * Additional compatible shapes receive
 * slightly lower scores.
 */

const FRAME_SHAPE_SCORE = {
  0: 50,
  1: 45,
  2: 40,
  3: 35,
};

// =========================================
// NORMALIZATION HELPERS
// =========================================

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const round = (value, decimals = 0) => {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
};

// =========================================
// GET COMPATIBLE FRAME SHAPES
// =========================================

export const getCompatibleFrameShapes = (faceShape) => {
  if (!faceShape) {
    return [];
  }

  const normalizedShape = String(faceShape).toUpperCase();

  return FACE_SHAPE_COMPATIBILITY[normalizedShape] || [];
};

// =========================================
// FACE SHAPE SCORE
// =========================================

const calculateFaceShapeScore = ({ faceShape, frameShape }) => {
  const compatibleShapes = getCompatibleFrameShapes(faceShape);

  const normalizedFrameShape = String(frameShape || "").toUpperCase();

  const index = compatibleShapes.indexOf(normalizedFrameShape);

  if (index === -1) {
    return {
      score: 0,
      rank: null,
      matched: false,
    };
  }

  return {
    score: FRAME_SHAPE_SCORE[index] ?? 30,

    rank: index + 1,
    matched: true,
  };
};

// =========================================
// FRAME WIDTH SCORE
// =========================================

/*
 * Face measurement contains an estimated
 * facial width in millimeters.
 *
 * Product contains an actual frameWidth
 * when available.
 *
 * We compare them to estimate how close
 * the frame is to the user's facial width.
 *
 * Because the face width itself is estimated,
 * this is intentionally treated as a
 * recommendation heuristic.
 */

const calculateFrameWidthScore = ({ faceWidth, frameWidth }) => {
  const userFaceWidth = toNumber(faceWidth);

  const productFrameWidth = toNumber(frameWidth);

  /*
   * No product frame width:
   * give a neutral score instead of
   * unfairly penalizing the product.
   */
  if (
    userFaceWidth === null ||
    productFrameWidth === null ||
    userFaceWidth <= 0 ||
    productFrameWidth <= 0
  ) {
    return {
      score: 10,
      difference: null,
      fit: "UNKNOWN",
    };
  }

  const difference = Math.abs(productFrameWidth - userFaceWidth);

  const percentageDifference = difference / userFaceWidth;

  let score = 20;
  let fit = "CLOSE";

  /*
   * Very close fit.
   */
  if (percentageDifference <= 0.03) {
    score = 20;
    fit = "EXCELLENT";
  } else if (percentageDifference <= 0.06) {

  /*
   * Good fit.
   */
    score = 18;
    fit = "GOOD";
  } else if (percentageDifference <= 0.1) {

  /*
   * Acceptable fit.
   */
    score = 15;
    fit = "ACCEPTABLE";
  } else if (percentageDifference <= 0.15) {

  /*
   * Somewhat different.
   */
    score = 10;
    fit = "LOOSE";
  } else if (percentageDifference <= 0.2) {

  /*
   * Considerably different.
   */
    score = 5;
    fit = "WIDE_DIFFERENCE";
  } else {

  /*
   * Very different.
   */
    score = 2;
    fit = "POOR";
  }

  return {
    score,
    difference: round(difference, 1),
    percentageDifference: round(percentageDifference * 100, 1),
    fit,
  };
};

// =========================================
// PRESCRIPTION SCORE
// =========================================

const calculatePrescriptionScore = ({ prescription, product }) => {
  /*
   * No prescription means the user can
   * still receive styling recommendations.
   *
   * Give neutral/full availability score.
   */
  if (!prescription) {
    return {
      score: 20,
      compatible: true,
      reason: "No saved prescription",
      details: {},
    };
  }

  const compatibility = product?.prescriptionCompatibility;

  /*
   * If product does not define prescription
   * compatibility, do not automatically reject it.
   *
   * Give a neutral score because there is
   * insufficient product data.
   */
  if (!compatibility) {
    return {
      score: 10,
      compatible: true,
      reason: "Prescription compatibility not specified",
      details: {},
    };
  }

  const odSph = toNumber(prescription?.OD?.sph);

  const osSph = toNumber(prescription?.OS?.sph);

  const odCyl = toNumber(prescription?.OD?.cyl);

  const osCyl = toNumber(prescription?.OS?.cyl);

  const strongestSph =
    odSph !== null && osSph !== null ? Math.max(odSph, osSph) : null;

  const weakestSph =
    odSph !== null && osSph !== null ? Math.min(odSph, osSph) : null;

  const maxRx = toNumber(compatibility.maxRx);

  const minRx = toNumber(compatibility.minRx);

  /*
   * Determine whether the basic spherical
   * prescription is inside the product range.
   */
  let rxRangeKnown =
    minRx !== null &&
    maxRx !== null &&
    weakestSph !== null &&
    strongestSph !== null;

  let rxRangeCompatible = true;

  if (rxRangeKnown) {
    rxRangeCompatible = minRx <= weakestSph && maxRx >= strongestSph;
  }

  if (!rxRangeCompatible) {
    return {
      score: 0,
      compatible: false,
      reason: "Prescription is outside the supported range",
      details: {
        minRx,
        maxRx,
        weakestSph,
        strongestSph,
      },
    };
  }

  let score = 17;

  let reason = "Prescription range is compatible";

  // =======================================
  // PRESCRIPTION TYPE
  // =======================================

  const prescriptionType = String(
    prescription.prescriptionType || "",
  ).toUpperCase();

  if (prescriptionType === "PROGRESSIVE") {
    if (compatibility.progressive) {
      score += 3;

      reason = "Supports your progressive prescription";
    } else {
      return {
        score: 0,
        compatible: false,
        reason: "Does not support progressive prescriptions",
        details: {
          minRx,
          maxRx,
          progressive: compatibility.progressive,
        },
      };
    }
  }

  if (prescriptionType === "READING") {
    if (compatibility.readers) {
      score += 3;

      reason = "Supports your reading prescription";
    } else {
      /*
       * Reading compatibility is optional
       * in some catalog records.
       *
       * Do not hard reject if the catalog
       * hasn't explicitly specified it.
       */
      if (compatibility.readers === false) {
        return {
          score: 0,
          compatible: false,
          reason: "Does not support reading prescriptions",
          details: {
            readers: compatibility.readers,
          },
        };
      }
    }
  }

  /*
   * Bifocal compatibility may not be directly
   * represented by your current prescription
   * enum, but support it when present.
   */
  if (prescriptionType === "BIFOCAL") {
    if (compatibility.bifocal) {
      score += 3;

      reason = "Supports your bifocal prescription";
    } else {
      return {
        score: 0,
        compatible: false,
        reason: "Does not support bifocal prescriptions",
        details: {
          bifocal: compatibility.bifocal,
        },
      };
    }
  }

  // Slight bonus when cylinder data exists
  // and product has a defined usable range.
  if ((odCyl !== null || osCyl !== null) && rxRangeKnown) {
    score += 0;
  }

  return {
    score: clamp(score, 0, 20),
    compatible: true,
    reason,
    details: {
      minRx,
      maxRx,
      weakestSph,
      strongestSph,
      odCyl,
      osCyl,
    },
  };
};

// =========================================
// STOCK SCORE
// =========================================

const calculateStockScore = (stock) => {
  const quantity = toNumber(stock) ?? 0;

  if (quantity <= 0) {
    return 0;
  }

  /*
   * More stock gets a slightly better
   * availability score.
   *
   * This affects ranking, but stock
   * availability is intentionally only
   * 10% of the total recommendation score.
   */

  if (quantity >= 10) {
    return 10;
  }

  if (quantity >= 5) {
    return 9;
  }

  if (quantity >= 3) {
    return 8;
  }

  if (quantity >= 2) {
    return 7;
  }

  return 6;
};

// =========================================
// MATCH LABEL
// =========================================

export const getMatchLabel = (score) => {
  if (score >= 90) {
    return "Best Match";
  }

  if (score >= 80) {
    return "Excellent Match";
  }

  if (score >= 70) {
    return "Great Match";
  }

  if (score >= 60) {
    return "Good Match";
  }

  return "Recommended";
};

// =========================================
// RECOMMENDATION SCORE
// =========================================

export const calculateRecommendationScore = ({
  faceMeasurement,
  prescription,
  product,
}) => {
  const faceShapeResult = calculateFaceShapeScore({
    faceShape: faceMeasurement?.faceShape,

    frameShape: product?.frameShape,
  });

  const frameWidthResult = calculateFrameWidthScore({
    faceWidth: faceMeasurement?.faceWidth,

    frameWidth: product?.size?.frameWidth,
  });

  const prescriptionResult = calculatePrescriptionScore({
    prescription,
    product,
  });

  const stockScore = calculateStockScore(product?.stock);

  /*
   * Do not recommend an explicitly
   * incompatible prescription product.
   */
  if (!prescriptionResult.compatible) {
    return {
      score: 0,
      eligible: false,
      label: "Not Compatible",
      reason: prescriptionResult.reason,
      breakdown: {
        faceShape: faceShapeResult.score,

        frameWidth: frameWidthResult.score,

        prescription: prescriptionResult.score,

        stock: stockScore,
      },
    };
  }

  const totalScore = clamp(
    Math.round(
      faceShapeResult.score +
        frameWidthResult.score +
        prescriptionResult.score +
        stockScore,
    ),
    0,
    100,
  );

  // =======================================
  // BUILD REASON
  // =======================================

  const faceShapeText = String(
    faceMeasurement?.faceShape || "your",
  ).toLowerCase();

  const frameShapeText = String(product?.frameShape || "frame")
    .toLowerCase()
    .replaceAll("_", " ");

  const reasons = [];

  // Face shape
  if (faceShapeResult.score >= 40) {
    reasons.push(
      `${capitalize(
        frameShapeText,
      )} frames complement your ${faceShapeText} face shape`,
    );
  } else {
    reasons.push(
      `This ${frameShapeText} frame matches your facial proportions`,
    );
  }

  // Width
  if (frameWidthResult.fit === "EXCELLENT") {
    reasons.push(
      "the frame width is a close fit for your estimated facial width",
    );
  } else if (frameWidthResult.fit === "GOOD") {
    reasons.push(
      "the frame width is a good match for your estimated facial width",
    );
  } else if (frameWidthResult.fit === "ACCEPTABLE") {
    reasons.push("the frame width is within an acceptable range");
  }

  // Prescription
  if (prescription && prescriptionResult.compatible) {
    reasons.push(prescriptionResult.reason.toLowerCase());
  }

  const reason = reasons.filter(Boolean).join(" and ") + ".";

  return {
    score: totalScore,

    eligible: true,

    label: getMatchLabel(totalScore),

    reason,

    breakdown: {
      faceShape: faceShapeResult.score,

      frameWidth: frameWidthResult.score,

      prescription: prescriptionResult.score,

      stock: stockScore,
    },

    details: {
      faceShapeRank: faceShapeResult.rank,

      frameWidthDifference: frameWidthResult.difference,

      frameWidthDifferencePercent: frameWidthResult.percentageDifference,

      frameFit: frameWidthResult.fit,

      prescription: prescriptionResult.details,
    },
  };
};

// =========================================
// CAPITALIZE
// =========================================

const capitalize = (value) => {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};
