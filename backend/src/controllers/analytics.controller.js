import UserEvent from "../models/UserEvent.js";
import Order from "../models/Order.js";

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
      },

      orders: {
        total: orders.totalOrders,

        delivered: orders.deliveredOrders,

        cancelled: orders.cancelledOrders,

        revenue: orders.totalRevenue,
      },

      topViewedProducts,

      topFavoritedProducts,

      topAddedToCartProducts,
    },

    error: null,
  });
});
