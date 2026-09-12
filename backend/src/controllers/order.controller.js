import mongoose from "mongoose";

import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Prescription from "../models/Prescription.js";
import Address from "../models/Address.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const SHIPPING_FEE = 60;

const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);

  return `VF-${timestamp}-${random}`;
};

export const createOrder = asyncHandler(async (req, res) => {
  const { addressId, paymentMethod = "COD" } = req.body;

  // -----------------------------------------
  // 1. Validate address ID
  // -----------------------------------------

  if (!addressId) {
    throw new ApiError(400, "Address ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    throw new ApiError(400, "Invalid address ID");
  }

  // -----------------------------------------
  // 2. Validate payment method
  // -----------------------------------------

  const allowedPaymentMethods = ["COD", "E_WALLET", "CARD"];

  if (!allowedPaymentMethods.includes(paymentMethod)) {
    throw new ApiError(400, "Invalid payment method");
  }

  const session = await mongoose.startSession();

  let createdOrder = null;

  try {
    // -----------------------------------------
    // 3. Start transaction
    // -----------------------------------------

    await session.withTransaction(async () => {
      const userId = req.user.userId;

      // -----------------------------------------
      // 4. Get user's cart
      // -----------------------------------------

      const cart = await Cart.findOne({
        userId,
      }).session(session);

      if (!cart || cart.items.length === 0) {
        throw new ApiError(400, "Cart is empty");
      }

      // -----------------------------------------
      // 5. Get user's address
      // -----------------------------------------

      const address = await Address.findOne({
        _id: addressId,
        userId,
      }).session(session);

      if (!address) {
        throw new ApiError(404, "Shipping address not found");
      }

      const orderItems = [];

      let subtotal = 0;

      // -----------------------------------------
      // 6. Validate every cart item
      // -----------------------------------------

      for (const cartItem of cart.items) {
        const product = await Product.findOne({
          _id: cartItem.productId,
          isActive: true,
        }).session(session);

        if (!product) {
          throw new ApiError(404, `Product not found: ${cartItem.productId}`);
        }

        // Stock validation
        if (cartItem.quantity > product.stock) {
          throw new ApiError(400, `Insufficient stock for ${product.name}`);
        }

        // -----------------------------------------
        // Prescription validation
        // -----------------------------------------

        let prescriptionSnapshot = null;

        if (cartItem.prescriptionId) {
          const prescription = await Prescription.findOne({
            _id: cartItem.prescriptionId,
            userId,
          }).session(session);

          if (!prescription) {
            throw new ApiError(
              404,
              `Prescription not found for ${product.name}`,
            );
          }

          prescriptionSnapshot = {
            OD: {
              sph: prescription.OD.sph,
              cyl: prescription.OD.cyl,
              axis: prescription.OD.axis,
              add: prescription.OD.add,
            },

            OS: {
              sph: prescription.OS.sph,
              cyl: prescription.OS.cyl,
              axis: prescription.OS.axis,
              add: prescription.OS.add,
            },

            pd: prescription.pd,
          };
        }

        // -----------------------------------------
        // Current server price
        // -----------------------------------------

        const unitPrice = product.price;

        const itemSubtotal = unitPrice * cartItem.quantity;

        subtotal += itemSubtotal;

        // -----------------------------------------
        // Historical order item
        // -----------------------------------------

        orderItems.push({
          productId: product._id,

          productName: product.name,

          quantity: cartItem.quantity,

          unitPrice,

          lensType: cartItem.lensType,

          prescriptionId: cartItem.prescriptionId || null,

          prescriptionSnapshot,

          coating: cartItem.coating,
        });
      }

      // -----------------------------------------
      // 7. Calculate totals server-side
      // -----------------------------------------

      const discount = 0;

      const total = subtotal + SHIPPING_FEE - discount;

      // -----------------------------------------
      // 8. Address snapshot
      // -----------------------------------------

      const addressSnapshot = {
        firstName: address.firstName,

        lastName: address.lastName,

        country: address.country,

        street: address.street,

        apartment: address.apartment,

        city: address.city,

        province: address.province,

        postalCode: address.postalCode,

        phone: address.phone,
      };

      // -----------------------------------------
      // 9. Create order
      // -----------------------------------------

      const orderData = {
        userId,

        orderNumber: generateOrderNumber(),

        items: orderItems,

        addressSnapshot,

        subtotal,

        shippingFee: SHIPPING_FEE,

        discount,

        total,

        paymentMethod,

        paymentStatus: "PENDING",

        orderStatus: "PENDING",
      };

      const createdOrders = await Order.create([orderData], {
        session,
      });

      createdOrder = createdOrders[0];

      // -----------------------------------------
      // 10. Reduce stock
      // -----------------------------------------

      for (const cartItem of cart.items) {
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: cartItem.productId,

            isActive: true,

            stock: {
              $gte: cartItem.quantity,
            },
          },

          {
            $inc: {
              stock: -cartItem.quantity,
            },
          },

          {
            new: true,
            session,
          },
        );

        if (!updatedProduct) {
          throw new ApiError(
            400,
            `Stock changed before checkout completed for product ${cartItem.productId}`,
          );
        }
      }

      // -----------------------------------------
      // 11. Clear cart
      // -----------------------------------------

      cart.items = [];

      await cart.save({
        session,
      });
    });

    // -----------------------------------------
    // 12. Transaction committed
    // -----------------------------------------

    return res.status(201).json({
      data: createdOrder,
      error: null,
    });
  } finally {
    await session.endSession();
  }
});

export const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    userId: req.user.userId,
  }).sort({
    createdAt: -1,
  });

  return res.status(200).json({
    data: orders,
    error: null,
  });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const order = await Order.findOne({
    _id: id,
    userId: req.user.userId,
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return res.status(200).json({
    data: order,
    error: null,
  });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .sort({
      createdAt: -1,
    })
    .populate("userId", "firstName lastName email");

  return res.status(200).json({
    data: orders,
    error: null,
  });
});

const ALLOWED_STATUS_TRANSITIONS = {
  PENDING: ["PROCESSING", "CANCELLED"],

  PROCESSING: ["SHIPPED", "CANCELLED"],

  SHIPPED: ["DELIVERED"],

  DELIVERED: [],

  CANCELLED: [],
};

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orderStatus } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const validStatuses = [
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  if (!validStatuses.includes(orderStatus)) {
    throw new ApiError(400, "Invalid order status");
  }

  const order = await Order.findById(id);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[order.orderStatus];

  if (
    order.orderStatus !== orderStatus &&
    !allowedTransitions.includes(orderStatus)
  ) {
    throw new ApiError(
      400,
      `Cannot change order status from ${order.orderStatus} to ${orderStatus}`,
    );
  }

  order.orderStatus = orderStatus;

  await order.save();

  return res.status(200).json({
    data: order,
    error: null,
  });
});
