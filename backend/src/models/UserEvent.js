import mongoose from "mongoose";

const userEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    eventType: {
      type: String,
      required: true,
      enum: [
        "PRODUCT_VIEW",
        "ADD_TO_CART",
        "REMOVE_FROM_CART",
        "FAVORITE",
        "UNFAVORITE",
        "FACE_SCAN",
        "CHECKOUT_STARTED",
        "ORDER_COMPLETED",
      ],
      index: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    collection: "userEvents",
  },
);

/*
 * Common analytics query:
 * "Show this user's events from newest to oldest."
 */
userEventSchema.index({
  userId: 1,
  timestamp: -1,
});

/*
 * Common analytics query:
 * "Count events of a specific type over time."
 */
userEventSchema.index({
  eventType: 1,
  timestamp: -1,
});

/*
 * Common analytics query:
 * "Find events associated with a product."
 */
userEventSchema.index({
  productId: 1,
  eventType: 1,
  timestamp: -1,
});

const UserEvent = mongoose.model("UserEvent", userEventSchema);

export default UserEvent;
