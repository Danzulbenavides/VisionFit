import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

// =========================================
// PRODUCT SIZE
// =========================================

const productSizeSchema = new Schema(
  {
    label: {
      type: String,
      enum: ["SMALL", "MEDIUM", "LARGE"],
      default: "MEDIUM",
    },

    frameWidth: {
      type: Number,
      min: 0,
    },

    bridgeWidth: {
      type: Number,
      min: 0,
    },

    lensWidth: {
      type: Number,
      min: 0,
    },

    lensHeight: {
      type: Number,
      min: 0,
    },

    templeLength: {
      type: Number,
      min: 0,
    },
  },
  { _id: false },
);

// =========================================
// PRESCRIPTION COMPATIBILITY
// =========================================

const prescriptionCompatibilitySchema = new Schema(
  {
    minRx: {
      type: Number,
    },

    maxRx: {
      type: Number,
    },

    progressive: {
      type: Boolean,
      default: false,
    },

    bifocal: {
      type: Boolean,
      default: false,
    },

    readers: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

// =========================================
// PRODUCT SCHEMA
// =========================================

const productSchema = new Schema(
  {
    // =====================================
    // BASIC PRODUCT INFORMATION
    // =====================================

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    brand: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "VisionFit",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // =====================================
    // PRODUCT CATEGORY
    // =====================================

    category: {
      type: String,
      enum: ["EYEGLASSES", "SUNGLASSES", "BLUE_LIGHT"],
      default: "EYEGLASSES",
      index: true,
    },

    // =====================================
    // FRAME SHAPE
    // =====================================

    frameShape: {
      type: String,
      enum: [
        "SQUARE",
        "RECTANGLE",
        "ROUND",
        "CAT_EYE",
        "BROWLINE",
        "AVIATOR",
        "BUTTERFLY",
        "GEOMETRIC",
      ],
      required: true,
      index: true,
    },

    // =====================================
    // MATERIAL
    // =====================================

    material: {
      type: String,
      enum: ["TR90", "ACETATE", "PLASTIC", "METAL", "TITANIUM", "MIXED"],
      required: true,
      index: true,
    },

    // =====================================
    // COLORS
    // =====================================

    colors: {
      type: [String],
      default: [],
    },

    // =====================================
    // FRAME DIMENSIONS
    // =====================================

    size: {
      type: productSizeSchema,
      default: () => ({}),
    },

    // =====================================
    // WEIGHT
    // =====================================

    weight: {
      type: Number,
      min: 0,
    },

    // =====================================
    // TARGET CATEGORY
    // =====================================

    genderCategory: {
      type: String,
      enum: ["WOMEN", "MEN", "UNISEX"],
      default: "UNISEX",
    },

    // =====================================
    // PRESCRIPTION COMPATIBILITY
    // =====================================

    prescriptionCompatibility: {
      type: prescriptionCompatibilitySchema,
      default: () => ({}),
    },

    // =====================================
    // NORMAL PRODUCT IMAGES
    // =====================================

    images: {
      type: [String],
      default: [],
    },

    // =====================================
    // VIRTUAL TRY-ON ASSET
    // =====================================

    /*
     * Transparent PNG/WebP containing ONLY
     * the eyeglass frame.
     *
     * Examples:
     *
     * /uploads/try-on/visionfit-test-frame.png
     *
     * https://example.com/frames/frame01.png
     */
    tryOnImage: {
      type: String,
      trim: true,
      default: null,
    },

    /*
     * Extra scale calibration.
     *
     * 1.0 = normal
     * 1.05 = slightly larger
     * 0.95 = slightly smaller
     *
     * Useful when the transparent image itself
     * contains extra transparent padding.
     */
    tryOnScale: {
      type: Number,
      min: 0.1,
      max: 5,
      default: 1,
    },

    /*
     * Horizontal calibration in pixels.
     *
     * Positive = move right
     * Negative = move left
     */
    tryOnOffsetX: {
      type: Number,
      min: -2000,
      max: 2000,
      default: 0,
    },

    /*
     * Vertical calibration in pixels.
     *
     * Positive = move down
     * Negative = move up
     */
    tryOnOffsetY: {
      type: Number,
      min: -2000,
      max: 2000,
      default: 0,
    },

    // =====================================
    // INVENTORY
    // =====================================

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // =====================================
    // ACTIVE STATUS
    // =====================================

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },

  {
    timestamps: true,
    collection: "products",
  },
);

// =========================================
// INDEXES
// =========================================

productSchema.index({
  isActive: 1,
  frameShape: 1,
  stock: 1,
});

productSchema.index({
  frameShape: 1,
  material: 1,
  price: 1,
});

productSchema.index({
  category: 1,
  isActive: 1,
  price: 1,
});

productSchema.index({
  name: "text",
  brand: "text",
  description: "text",
});

// =========================================
// EXPORT
// =========================================

const Product = models.Product || model("Product", productSchema);

export default Product;
