import mongoose from "mongoose";

import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Prescription from "../models/Prescription.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  LENS_TYPES,
  COATINGS,
  calculateUnitPrice,
} from "../utils/lensPricing.js";

// =========================================
// SELECTION PARSING (multi-select lens/coating)
// Accepts a single string (legacy) or an array.
// Enforces: non-empty, no duplicates, valid values,
// and exclusive values (FRAME_ONLY / NONE) cannot be combined.
// =========================================

const parseSelections = (value, allowed, exclusive, fieldName) => {
  const selections = Array.isArray(value) ? value : [value];

  if (
    selections.length === 0 ||
    selections.some((item) => typeof item !== "string" || !allowed.includes(item))
  ) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }

  if (new Set(selections).size !== selections.length) {
    throw new ApiError(400, `Duplicate ${fieldName} selections are not allowed`);
  }

  if (selections.includes(exclusive) && selections.length > 1) {
    throw new ApiError(400, `"${exclusive}" cannot be combined with other ${fieldName} options`);
  }

  return selections;
};

// Order-insensitive comparison; tolerates legacy docs that stored a single
// string instead of an array.
const sameSelections = (a, b) => {
  const left = [...(Array.isArray(a) ? a : a ? [a] : [])].sort().join("|");
  const right = [...(Array.isArray(b) ? b : b ? [b] : [])].sort().join("|");
  return left === right;
};

// =========================================
// GET CART
// =========================================

export const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({
    userId: req.user.userId,
  }).populate("items.productId");

  // User has no cart yet
  if (!cart) {
    return res.status(200).json({
      data: {
        userId: req.user.userId,
        items: [],
        totalItems: 0,
        subtotal: 0,
      },
      error: null,
    });
  }

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  return res.status(200).json({
    data: {
      id: cart._id,
      userId: cart.userId,
      items: cart.items,
      totalItems,
      subtotal,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    },
    error: null,
  });
});

// =========================================
// ADD CART ITEM
// =========================================

export const addCartItem = asyncHandler(async (req, res) => {
  const {
    productId,
    quantity = 1,
    lensType = ["FRAME_ONLY"],
    prescriptionId = null,
    coating = ["NONE"],
  } = req.body;

  // -----------------------------------------
  // Validate product ID
  // -----------------------------------------

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  // -----------------------------------------
  // Validate quantity
  // -----------------------------------------

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ApiError(400, "Quantity must be a positive integer");
  }

  // -----------------------------------------
  // Validate lens type + coating selections
  // -----------------------------------------

  const lensSelections = parseSelections(
    lensType,
    LENS_TYPES,
    "FRAME_ONLY",
    "lens type",
  );

  const coatingSelections = parseSelections(
    coating,
    COATINGS,
    "NONE",
    "coating",
  );

  if (
    lensSelections.includes("FRAME_ONLY") &&
    !(coatingSelections.length === 1 && coatingSelections[0] === "NONE")
  ) {
    throw new ApiError(400, "Frame only items cannot have coatings");
  }

  // -----------------------------------------
  // Validate prescription ID
  // -----------------------------------------

  if (
    prescriptionId !== null &&
    !mongoose.Types.ObjectId.isValid(prescriptionId)
  ) {
    throw new ApiError(400, "Invalid prescription ID");
  }

  // -----------------------------------------
  // Find active product
  // -----------------------------------------

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // -----------------------------------------
  // Check stock
  // -----------------------------------------

  if (quantity > product.stock) {
    throw new ApiError(400, "Requested quantity exceeds available stock");
  }

  // -----------------------------------------
  // Verify prescription ownership
  // -----------------------------------------

  if (prescriptionId !== null) {
    const prescription = await Prescription.findOne({
      _id: prescriptionId,
      userId: req.user.userId,
    });

    if (!prescription) {
      throw new ApiError(404, "Prescription not found");
    }
  }

  // -----------------------------------------
  // Find or create cart
  // -----------------------------------------

  let cart = await Cart.findOne({
    userId: req.user.userId,
  });

  if (!cart) {
    cart = await Cart.create({
      userId: req.user.userId,
      items: [],
    });
  }

  // -----------------------------------------
  // Check for existing configuration
  // -----------------------------------------

  const existingItem = cart.items.find(
    (item) =>
      item.productId.toString() === productId &&
      sameSelections(item.lensType, lensSelections) &&
      sameSelections(item.coating, coatingSelections) &&
      String(item.prescriptionId) === String(prescriptionId),
  );

  // -----------------------------------------
  // Price = frame + lens types + coatings
  // -----------------------------------------

  const pricing = calculateUnitPrice(
    product,
    lensSelections,
    coatingSelections,
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;

    if (newQuantity > product.stock) {
      throw new ApiError(400, "Updated quantity exceeds available stock");
    }

    existingItem.quantity = newQuantity;

    // Always use current product pricing
    existingItem.framePrice = pricing.framePrice;
    existingItem.lensPrice = pricing.lensPrice;
    existingItem.coatingPrice = pricing.coatingPrice;
    existingItem.unitPrice = pricing.unitPrice;
  } else {
    cart.items.push({
      productId: product._id,
      quantity,
      lensType: lensSelections,
      prescriptionId,
      coating: coatingSelections,
      framePrice: pricing.framePrice,
      lensPrice: pricing.lensPrice,
      coatingPrice: pricing.coatingPrice,
      unitPrice: pricing.unitPrice,
    });
  }

  await cart.save();

  const populatedCart = await Cart.findById(cart._id).populate(
    "items.productId",
  );

  return res.status(201).json({
    data: populatedCart,
    error: null,
  });
});

// =========================================
// UPDATE CART ITEM
// =========================================

export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const { quantity, lensType, prescriptionId, coating } = req.body;

  // -----------------------------------------
  // Validate product ID
  // -----------------------------------------

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  // -----------------------------------------
  // Validate quantity
  // -----------------------------------------

  if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 1)) {
    throw new ApiError(400, "Quantity must be a positive integer");
  }

  // -----------------------------------------
  // Validate lens type + coating selections
  // -----------------------------------------

  const lensSelections =
    lensType !== undefined
      ? parseSelections(lensType, LENS_TYPES, "FRAME_ONLY", "lens type")
      : undefined;

  const coatingSelections =
    coating !== undefined
      ? parseSelections(coating, COATINGS, "NONE", "coating")
      : undefined;

  // -----------------------------------------
  // Validate prescription
  // -----------------------------------------

  if (
    prescriptionId !== undefined &&
    prescriptionId !== null &&
    !mongoose.Types.ObjectId.isValid(prescriptionId)
  ) {
    throw new ApiError(400, "Invalid prescription ID");
  }

  // -----------------------------------------
  // Get user's cart
  // -----------------------------------------

  const cart = await Cart.findOne({
    userId: req.user.userId,
  });

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const item = cart.items.find(
    (cartItem) => cartItem.productId.toString() === productId,
  );

  if (!item) {
    throw new ApiError(404, "Cart item not found");
  }

  // -----------------------------------------
  // Verify product
  // -----------------------------------------

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // -----------------------------------------
  // Check stock
  // -----------------------------------------

  if (quantity !== undefined && quantity > product.stock) {
    throw new ApiError(400, "Quantity exceeds available stock");
  }

  // -----------------------------------------
  // Verify prescription ownership
  // -----------------------------------------

  if (prescriptionId !== undefined && prescriptionId !== null) {
    const prescription = await Prescription.findOne({
      _id: prescriptionId,
      userId: req.user.userId,
    });

    if (!prescription) {
      throw new ApiError(404, "Prescription not found");
    }

    item.prescriptionId = prescription._id;
  }

  if (quantity !== undefined) {
    item.quantity = quantity;
  }

  if (lensSelections !== undefined) {
    item.lensType = lensSelections;
  }

  if (coatingSelections !== undefined) {
    item.coating = coatingSelections;
  }

  if (prescriptionId === null) {
    item.prescriptionId = null;
  }

  // Frame only items cannot carry coatings (check the effective result)
  const effectiveLens = Array.isArray(item.lensType)
    ? item.lensType
    : item.lensType
      ? [item.lensType]
      : [];
  const effectiveCoating = Array.isArray(item.coating)
    ? item.coating
    : item.coating
      ? [item.coating]
      : [];

  if (
    effectiveLens.includes("FRAME_ONLY") &&
    !(
      effectiveCoating.length === 1 &&
      effectiveCoating[0] === "NONE"
    )
  ) {
    throw new ApiError(400, "Frame only items cannot have coatings");
  }

  // Always refresh pricing from current product
  const pricing = calculateUnitPrice(product, item.lensType, item.coating);

  item.framePrice = pricing.framePrice;
  item.lensPrice = pricing.lensPrice;
  item.coatingPrice = pricing.coatingPrice;
  item.unitPrice = pricing.unitPrice;

  await cart.save();

  const populatedCart = await Cart.findById(cart._id).populate(
    "items.productId",
  );

  return res.status(200).json({
    data: populatedCart,
    error: null,
  });
});

// =========================================
// REMOVE CART ITEM
// =========================================

export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const cart = await Cart.findOne({
    userId: req.user.userId,
  });

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const originalLength = cart.items.length;

  cart.items = cart.items.filter(
    (item) => item.productId.toString() !== productId,
  );

  if (cart.items.length === originalLength) {
    throw new ApiError(404, "Cart item not found");
  }

  await cart.save();

  return res.status(200).json({
    data: {
      message: "Cart item removed successfully",
    },
    error: null,
  });
});

// =========================================
// CLEAR CART
// =========================================

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({
    userId: req.user.userId,
  });

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  cart.items = [];

  await cart.save();

  return res.status(200).json({
    data: {
      message: "Cart cleared successfully",
    },
    error: null,
  });
});
