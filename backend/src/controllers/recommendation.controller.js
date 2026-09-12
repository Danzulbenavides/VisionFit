import FaceMeasurement from "../models/FaceMeasurement.js";
import Prescription from "../models/Prescription.js";
import Product from "../models/Product.js";

import {
  getCompatibleFrameShapes,
  calculateRecommendationScore,
} from "../services/recommendation.service.js";

// =========================================
// GET RECOMMENDATIONS
// =========================================

export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log("========================================");

    console.log("RECOMMENDATIONS: START");

    console.log("RECOMMENDATIONS: USER", userId);

    // =======================================
    // 1. GET LATEST FACE MEASUREMENT
    // =======================================

    const faceMeasurement = await FaceMeasurement.findOne({
      userId,
    }).sort({
      createdAt: -1,
    });

    if (!faceMeasurement) {
      return res.status(404).json({
        data: null,

        error: {
          message:
            "No face measurement found. Please complete a face scan first.",
        },
      });
    }

    console.log("RECOMMENDATIONS: FACE", {
      faceShape: faceMeasurement.faceShape,

      pupilDistance: faceMeasurement.pupilDistance,

      faceWidth: faceMeasurement.faceWidth,

      faceLength: faceMeasurement.faceLength,

      confidence: faceMeasurement.confidence,
    });

    // =======================================
    // 2. GET LATEST PRESCRIPTION
    // =======================================

    const prescription = await Prescription.findOne({
      userId,
    }).sort({
      createdAt: -1,
    });

    console.log(
      "RECOMMENDATIONS: PRESCRIPTION",
      prescription ? "FOUND" : "NOT FOUND",
    );

    // =======================================
    // 3. GET COMPATIBLE SHAPES
    // =======================================

    const compatibleFrameShapes = getCompatibleFrameShapes(
      faceMeasurement.faceShape,
    );

    console.log("RECOMMENDATIONS: COMPATIBLE SHAPES", compatibleFrameShapes);

    if (compatibleFrameShapes.length === 0) {
      return res.status(200).json({
        data: {
          faceShape: faceMeasurement.faceShape,

          pupilDistance: faceMeasurement.pupilDistance,

          faceWidth: faceMeasurement.faceWidth,

          faceLength: faceMeasurement.faceLength,

          confidence: faceMeasurement.confidence,

          prescriptionUsed: prescription !== null,

          compatibleFrameShapes: [],

          recommendations: [],
        },

        error: null,
      });
    }

    // =======================================
    // 4. FIND ACTIVE / STOCKED PRODUCTS
    // =======================================

    /*
     * We intentionally let the scoring engine
     * handle prescription compatibility.
     *
     * This means products can still be ranked
     * when prescription compatibility information
     * is missing from the catalog.
     */

    const productQuery = {
      isActive: true,

      stock: {
        $gt: 0,
      },

      frameShape: {
        $in: compatibleFrameShapes,
      },
    };

    const products = await Product.find(productQuery).limit(100).lean();

    console.log("RECOMMENDATIONS: PRODUCTS FOUND", products.length);

    // =======================================
    // 5. SCORE EVERY PRODUCT
    // =======================================

    const scoredRecommendations = products
      .map((product) => {
        const scoring = calculateRecommendationScore({
          faceMeasurement,
          prescription,
          product,
        });

        return {
          product,

          matchScore: scoring.score,

          matchLabel: scoring.label,

          reason: scoring.reason,

          scoreBreakdown: scoring.breakdown,

          scoreDetails: scoring.details,

          eligible: scoring.eligible,
        };
      })

      /*
       * Remove products that the scoring engine
       * explicitly rejected because the
       * prescription is incompatible.
       */
      .filter((recommendation) => recommendation.eligible)

      /*
       * Highest match score first.
       *
       * If scores are equal, prefer products
       * with more stock.
       *
       * If still equal, newest product first.
       */
      .sort((first, second) => {
        if (second.matchScore !== first.matchScore) {
          return second.matchScore - first.matchScore;
        }

        const secondStock = Number(second.product?.stock || 0);

        const firstStock = Number(first.product?.stock || 0);

        if (secondStock !== firstStock) {
          return secondStock - firstStock;
        }

        const secondDate = new Date(second.product?.createdAt || 0).getTime();

        const firstDate = new Date(first.product?.createdAt || 0).getTime();

        return secondDate - firstDate;
      })

      /*
       * Only send the top 20.
       */
      .slice(0, 20);

    // =======================================
    // 6. LOG TOP RESULTS
    // =======================================

    console.log("RECOMMENDATIONS: TOP RESULTS");

    scoredRecommendations.slice(0, 5).forEach((recommendation, index) => {
      console.log(`${index + 1}.`, {
        name: recommendation.product?.name,

        frameShape: recommendation.product?.frameShape,

        score: recommendation.matchScore,

        label: recommendation.matchLabel,

        breakdown: recommendation.scoreBreakdown,
      });
    });

    console.log("RECOMMENDATIONS: COMPLETE");

    console.log("========================================");

    // =======================================
    // 7. RETURN RESPONSE
    // =======================================

    return res.status(200).json({
      data: {
        faceShape: faceMeasurement.faceShape,

        pupilDistance: faceMeasurement.pupilDistance,

        faceWidth: faceMeasurement.faceWidth,

        faceLength: faceMeasurement.faceLength,

        confidence: faceMeasurement.confidence,

        prescriptionUsed: prescription !== null,

        compatibleFrameShapes,

        recommendations: scoredRecommendations,
      },

      error: null,
    });
  } catch (error) {
    console.error("Recommendation error:", error);

    return res.status(500).json({
      data: null,

      error: {
        message: "Failed to generate recommendations",
      },
    });
  }
};
