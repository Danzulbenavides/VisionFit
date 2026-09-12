import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
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

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "carts",
  },
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
