import mongoose from "mongoose";

/*
 * Historical copy of the prescription used for the order.
 * We keep this embedded so an old order does not change
 * when the user's saved prescription is edited later.
 */
const prescriptionSnapshotSchema = new mongoose.Schema(
  {
    OD: {
      sph: {
        type: Number,
        required: true,
      },
      cyl: {
        type: Number,
        required: true,
      },
      axis: {
        type: Number,
        required: true,
      },
      add: {
        type: Number,
        default: 0,
      },
    },

    OS: {
      sph: {
        type: Number,
        required: true,
      },
      cyl: {
        type: Number,
        required: true,
      },
      axis: {
        type: Number,
        required: true,
      },
      add: {
        type: Number,
        default: 0,
      },
    },

    pd: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  },
);

/*
 * Historical copy of the shipping address.
 * We intentionally embed this instead of referencing the
 * current address because an order must preserve the
 * address used at the time of purchase.
 */
const addressSnapshotSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },

    street: {
      type: String,
      required: true,
      trim: true,
    },

    apartment: {
      type: String,
      default: null,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    province: {
      type: String,
      required: true,
      trim: true,
    },

    postalCode: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

/*
 * One product purchased in the order.
 *
 * productId:
 *   Reference to the current product document.
 *
 * productName / unitPrice:
 *   Historical snapshot of what was purchased.
 */
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    lensType: {
      type: String,
      enum: [
        "FRAME_ONLY",
        "STANDARD",
        "THIN",
        "PROGRESSIVE",
        "PHOTOCHROMIC",
        "BLUE_LIGHT",
        "TRANSITIONS",
        "DRIVING",
      ],
      default: "FRAME_ONLY",
    },

    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
      default: null,
    },

    prescriptionSnapshot: {
      type: prescriptionSnapshotSchema,
      default: null,
    },

    coating: {
      type: String,
      enum: [
        "NONE",
        "ANTI_REFLECTIVE",
        "SUPER_HYDROPHOBIC",
        "UV_PROTECTION",
        "SCRATCH_RESISTANT",
      ],
      default: "NONE",
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new mongoose.Schema(
  {
    /*
     * Customer who placed the order.
     */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
     * Human-readable order number.
     * Example: VF-2026-000001
     */
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    /*
     * Products purchased.
     */
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message: "An order must contain at least one item",
      },
    },

    /*
     * Historical shipping address.
     */
    addressSnapshot: {
      type: addressSnapshotSchema,
      required: true,
    },

    /*
     * Amount breakdown.
     */
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    shippingFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    discount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Payment information.
     * For the student MVP, this can remain simple.
     */
    paymentMethod: {
      type: String,
      required: true,
      enum: ["COD", "E_WALLET", "CARD"],
    },

    paymentStatus: {
      type: String,
      required: true,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },

    /*
     * Order lifecycle.
     */
    orderStatus: {
      type: String,
      required: true,
      enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "orders",
  },
);

/*
 * Useful query patterns for:
 * - My Orders
 * - Order history
 * - Admin order management
 */
orderSchema.index({
  userId: 1,
  createdAt: -1,
});

orderSchema.index({
  orderStatus: 1,
  createdAt: -1,
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
