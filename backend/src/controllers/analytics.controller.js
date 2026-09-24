import UserEvent from "../models/UserEvent.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

import asyncHandler from "../utils/asyncHandler.js";

export const getAnalyticsSummary = asyncHandler(async (req, res) => {
  /*
   * -----------------------------------------
   * 1. Count user events by type
   * -----------------------------------------
   */

  const eventCounts = await UserEvent.aggregate([
    {
      $group: {
        _id: "$eventType",
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const eventCountMap = {};

  for (const event of eventCounts) {
    eventCountMap[event._id] = event.count;
  }

  /*
   * -----------------------------------------
   * 2. Order statistics
   * -----------------------------------------
   */

  const orderStats = await Order.aggregate([
    {
      $group: {
        _id: null,

        totalOrders: {
          $sum: 1,
        },

        deliveredOrders: {
          $sum: {
            $cond: [
              {
                $eq: ["$orderStatus", "DELIVERED"],
              },
              1,
              0,
            ],
          },
        },

        cancelledOrders: {
          $sum: {
            $cond: [
              {
                $eq: ["$orderStatus", "CANCELLED"],
              },
              1,
              0,
            ],
          },
        },

        totalRevenue: {
          $sum: {
            $cond: [
              {
                $eq: ["$orderStatus", "DELIVERED"],
              },
              "$total",
              0,
            ],
          },
        },
      },
    },
  ]);

  const orders = orderStats[0] || {
    totalOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
  };

  /*
   * -----------------------------------------
   * 3. Popular frame shapes
   * -----------------------------------------
   */

  const popularFrameShapes = await UserEvent.aggregate([
    {
      $match: {
        eventType: "PRODUCT_VIEW",
        productId: {
          $ne: null,
        },
      },
    },

    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product",
      },
    },

    {
      $unwind: {
        path: "$product",
        preserveNullAndEmptyArrays: false,
      },
    },

    {
      $group: {
        _id: "$product.frameShape",

        views: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        views: -1,
      },
    },

    {
      $limit: 10,
    },

    {
      $project: {
        _id: 0,
        frameShape: "$_id",
        views: 1,
      },
    },
  ]);

  /*
   * -----------------------------------------
   * 3. Most viewed products
   * -----------------------------------------
   */

  const topViewedProducts = await UserEvent.aggregate([
    {
      $match: {
        eventType: "PRODUCT_VIEW",
        productId: {
          $ne: null,
        },
      },
    },

    {
      $group: {
        _id: "$productId",

        views: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        views: -1,
      },
    },

    {
      $limit: 5,
    },

    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },

    {
      $unwind: {
        path: "$product",
        preserveNullAndEmptyArrays: false,
      },
    },

    {
      $project: {
        _id: 0,

        productId: "$_id",

        name: "$product.name",

        price: "$product.price",

        frameShape: "$product.frameShape",

        views: 1,
      },
    },
  ]);

  /*
   * -----------------------------------------
   * 4. Most favorited products
   * -----------------------------------------
   */

  const topFavoritedProducts = await UserEvent.aggregate([
    {
      $match: {
        eventType: "FAVORITE",
        productId: {
          $ne: null,
        },
      },
    },

    {
      $group: {
        _id: "$productId",

        favorites: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        favorites: -1,
      },
    },

    {
      $limit: 5,
    },

    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },

    {
      $unwind: {
        path: "$product",
        preserveNullAndEmptyArrays: false,
      },
    },

    {
      $project: {
        _id: 0,

        productId: "$_id",

        name: "$product.name",

        price: "$product.price",

        frameShape: "$product.frameShape",

        favorites: 1,
      },
    },
  ]);

  /*
   * -----------------------------------------
   * 5. Recommendation feedback statistics
   * -----------------------------------------
   */

  const recommendationFeedbackStats = await UserEvent.aggregate([
    {
      $match: {
        eventType: "RECOMMENDATION_FEEDBACK",
      },
    },

    {
      $group: {
        _id: null,

        totalFeedback: {
          $sum: 1,
        },

        helpful: {
          $sum: {
            $cond: [
              {
                $eq: ["$metadata.helpful", true],
              },
              1,
              0,
            ],
          },
        },

        notHelpful: {
          $sum: {
            $cond: [
              {
                $eq: ["$metadata.helpful", false],
              },
              1,
              0,
            ],
          },
        },

        averageMatchScore: {
          $avg: "$metadata.matchScore",
        },
      },
    },
  ]);

  const recommendationFeedback = recommendationFeedbackStats[0] || {
    totalFeedback: 0,
    helpful: 0,
    notHelpful: 0,
    averageMatchScore: 0,
  };

  const helpfulRate =
    recommendationFeedback.totalFeedback > 0
      ? (recommendationFeedback.helpful /
          recommendationFeedback.totalFeedback) *
        100
      : 0;

  /*
   * -----------------------------------------
   * 6. Recommendation feedback by product
   * -----------------------------------------
   */

  const recommendationFeedbackByProduct = await UserEvent.aggregate([
    {
      $match: {
        eventType: "RECOMMENDATION_FEEDBACK",
        productId: {
          $ne: null,
        },
      },
    },

    {
      $group: {
        _id: "$productId",

        totalFeedback: {
          $sum: 1,
        },

        helpful: {
          $sum: {
            $cond: [
              {
                $eq: ["$metadata.helpful", true],
              },
              1,
              0,
            ],
          },
        },

        notHelpful: {
          $sum: {
            $cond: [
              {
                $eq: ["$metadata.helpful", false],
              },
              1,
              0,
            ],
          },
        },

        averageMatchScore: {
          $avg: "$metadata.matchScore",
        },
      },
    },

    {
      $sort: {
        totalFeedback: -1,
      },
    },

    {
      $limit: 10,
    },

    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },

    {
      $unwind: {
        path: "$product",
        preserveNullAndEmptyArrays: false,
      },
    },

    {
      $project: {
        _id: 0,

        productId: "$_id",

        name: "$product.name",

        totalFeedback: 1,

        helpful: 1,

        notHelpful: 1,

        averageMatchScore: {
          $round: [
            {
              $ifNull: ["$averageMatchScore", 0],
            },
            2,
          ],
        },
      },
    },
  ]);

  /*
   * -----------------------------------------
   * 7. Recommendation feedback by face shape
   * -----------------------------------------
   */

  const recommendationFeedbackByFaceShape = await UserEvent.aggregate([
    {
      $match: {
        eventType: "RECOMMENDATION_FEEDBACK",
        "metadata.faceShape": {
          $nin: [null, ""],
        },
      },
    },

    {
      $group: {
        _id: "$metadata.faceShape",

        totalFeedback: {
          $sum: 1,
        },

        helpful: {
          $sum: {
            $cond: [
              {
                $eq: ["$metadata.helpful", true],
              },
              1,
              0,
            ],
          },
        },

        notHelpful: {
          $sum: {
            $cond: [
              {
                $eq: ["$metadata.helpful", false],
              },
              1,
              0,
            ],
          },
        },

        averageMatchScore: {
          $avg: "$metadata.matchScore",
        },
      },
    },

    {
      $sort: {
        totalFeedback: -1,
      },
    },

    {
      $project: {
        _id: 0,

        faceShape: "$_id",

        totalFeedback: 1,

        helpful: 1,

        notHelpful: 1,

        helpfulRate: {
          $round: [
            {
              $multiply: [
                {
                  $cond: [
                    {
                      $gt: ["$totalFeedback", 0],
                    },
                    {
                      $divide: ["$helpful", "$totalFeedback"],
                    },
                    0,
                  ],
                },
                100,
              ],
            },
            2,
          ],
        },

        averageMatchScore: {
          $round: [
            {
              $ifNull: ["$averageMatchScore", 0],
            },
            2,
          ],
        },
      },
    },
  ]);
  /*
   * -----------------------------------------
   * 5. Most added-to-cart products
   * -----------------------------------------
   */

  const topAddedToCartProducts = await UserEvent.aggregate([
    {
      $match: {
        eventType: "ADD_TO_CART",
        productId: {
          $ne: null,
        },
      },
    },

    {
      $group: {
        _id: "$productId",

        addToCartCount: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        addToCartCount: -1,
      },
    },

    {
      $limit: 5,
    },

    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },

    {
      $unwind: {
        path: "$product",
        preserveNullAndEmptyArrays: false,
      },
    },

    {
      $project: {
        _id: 0,

        productId: "$_id",

        name: "$product.name",

        price: "$product.price",

        frameShape: "$product.frameShape",

        addToCartCount: 1,
      },
    },
  ]);

  /*
   * -----------------------------------------
   * 6. Return analytics summary
   * -----------------------------------------
   */

  return res.status(200).json({
    data: {
      events: {
        total: Object.values(eventCountMap).reduce(
          (sum, count) => sum + count,
          0,
        ),

        productViews: eventCountMap.PRODUCT_VIEW || 0,

        addToCart: eventCountMap.ADD_TO_CART || 0,

        removeFromCart: eventCountMap.REMOVE_FROM_CART || 0,

        favorites: eventCountMap.FAVORITE || 0,

        unfavorites: eventCountMap.UNFAVORITE || 0,

        faceScans: eventCountMap.FACE_SCAN || 0,

        checkoutStarted: eventCountMap.CHECKOUT_STARTED || 0,

        orderCompletedEvents: eventCountMap.ORDER_COMPLETED || 0,

        recommendationFeedback: eventCountMap.RECOMMENDATION_FEEDBACK || 0,
      },
      recommendationAnalytics: {
        totalFeedback: recommendationFeedback.totalFeedback,

        helpful: recommendationFeedback.helpful,

        notHelpful: recommendationFeedback.notHelpful,

        helpfulRate: Number(helpfulRate.toFixed(2)),

        averageMatchScore: Number(
          Number(recommendationFeedback.averageMatchScore || 0).toFixed(2),
        ),
      },

      recommendationFeedbackByProduct,
      recommendationFeedbackByFaceShape,
      orders: {
        total: orders.totalOrders,

        delivered: orders.deliveredOrders,

        cancelled: orders.cancelledOrders,

        revenue: orders.totalRevenue,
      },

      popularFrameShapes,
      topViewedProducts,
      topFavoritedProducts,
      topAddedToCartProducts,
    },

    error: null,
  });
});

// =========================================
// PRODUCT DATA QUALITY CHECKER
// =========================================

export const getProductDataQuality = asyncHandler(async (req, res) => {
  const products = await Product.find({
    isActive: true,
  })
    .select(
      "name price stock category frameShape material description colors images prescriptionCompatibility tryOnImage",
    )
    .sort({
      createdAt: -1,
    })
    .lean();

  const issues = [];

  const summary = {
    totalProducts: products.length,

    productsWithIssues: 0,

    missingName: 0,

    missingPrice: 0,

    missingCategory: 0,

    missingFrameShape: 0,

    missingMaterial: 0,

    missingDescription: 0,

    missingImage: 0,

    missingPrescriptionData: 0,

    missingTryOnImage: 0,
  };

  for (const product of products) {
    const productIssues = [];

    // -----------------------------------------
    // NAME
    // -----------------------------------------

    if (!product.name || !String(product.name).trim()) {
      productIssues.push("Missing product name");
      summary.missingName += 1;
    }

    // -----------------------------------------
    // PRICE
    // -----------------------------------------

    if (
      product.price === undefined ||
      product.price === null ||
      !Number.isFinite(Number(product.price)) ||
      Number(product.price) < 0
    ) {
      productIssues.push("Missing or invalid price");
      summary.missingPrice += 1;
    }

    // -----------------------------------------
    // CATEGORY
    // -----------------------------------------

    if (!product.category) {
      productIssues.push("Missing category");
      summary.missingCategory += 1;
    }

    // -----------------------------------------
    // FRAME SHAPE
    // -----------------------------------------

    if (!product.frameShape) {
      productIssues.push("Missing frame shape");
      summary.missingFrameShape += 1;
    }

    // -----------------------------------------
    // MATERIAL
    // -----------------------------------------

    if (!product.material) {
      productIssues.push("Missing material");
      summary.missingMaterial += 1;
    }

    // -----------------------------------------
    // DESCRIPTION
    // -----------------------------------------

    if (!product.description || !String(product.description).trim()) {
      productIssues.push("Missing description");
      summary.missingDescription += 1;
    }

    // -----------------------------------------
    // PRODUCT IMAGE
    // -----------------------------------------

    const hasProductImage =
      Array.isArray(product.images) &&
      product.images.some((image) => image && String(image).trim());

    if (!hasProductImage) {
      productIssues.push("Missing product image");
      summary.missingImage += 1;
    }

    // -----------------------------------------
    // PRESCRIPTION DATA
    // -----------------------------------------

    const prescription = product.prescriptionCompatibility || {};

    const hasPrescriptionData =
      prescription.minRx !== undefined ||
      prescription.maxRx !== undefined ||
      prescription.progressive === true ||
      prescription.bifocal === true ||
      prescription.readers === true;

    if (!hasPrescriptionData) {
      productIssues.push("Prescription compatibility is not configured");

      summary.missingPrescriptionData += 1;
    }

    // -----------------------------------------
    // VIRTUAL TRY-ON IMAGE
    // -----------------------------------------

    if (!product.tryOnImage || !String(product.tryOnImage).trim()) {
      productIssues.push("Missing Virtual Try-On image");

      summary.missingTryOnImage += 1;
    }

    // -----------------------------------------
    // RECORD PRODUCT IF IT HAS ISSUES
    // -----------------------------------------

    if (productIssues.length > 0) {
      summary.productsWithIssues += 1;

      issues.push({
        productId: product._id,

        name: product.name,

        frameShape: product.frameShape,

        category: product.category,

        issues: productIssues,
      });
    }
  }

  return res.status(200).json({
    data: {
      summary,
      issues,
    },

    error: null,
  });
});
