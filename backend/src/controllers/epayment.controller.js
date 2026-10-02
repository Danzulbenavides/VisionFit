import mongoose from "mongoose";

import Order from "../models/Order.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

import {
  createCheckoutSession,
  verifyWebhookSignature,
} from "../services/epayment.service.js";

export const initiatePayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    throw new ApiError(400, "A valid orderId is required");
  }

  const order = await Order.findOne({
    _id: orderId,
    userId: req.user.userId,
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.paymentStatus === "PAID") {
    throw new ApiError(400, "This order has already been paid for");
  }

  if (order.orderStatus === "CANCELLED") {
    throw new ApiError(400, "This order has been cancelled");
  }

  const { checkoutSessionId, checkoutUrl } =
    await createCheckoutSession(order);

  order.paymentReference = checkoutSessionId;

  await order.save();

  return res.status(200).json({
    data: {
      checkoutUrl,
    },
    error: null,
  });
});

const findOrderForEvent = async (resourceObject) => {
  const orderId = resourceObject?.attributes?.metadata?.orderId;

  if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
    const order = await Order.findById(orderId);
    if (order) return order;
  }

  const referenceNumber = resourceObject?.attributes?.reference_number;

  if (referenceNumber) {
    const order = await Order.findOne({ orderNumber: referenceNumber });
    if (order) return order;
  }

  const resourceId = resourceObject?.id;

  if (resourceId) {
    const order = await Order.findOne({ paymentReference: resourceId });
    if (order) return order;
  }

  return null;
};

export const handleWebhook = asyncHandler(async (req, res) => {
  const signatureHeader = req.headers["paymongo-signature"];
  const rawBody = req.body;

  if (!Buffer.isBuffer(rawBody)) {
    throw new ApiError(500, "Webhook route is misconfigured");
  }

  const isValid = verifyWebhookSignature(
    rawBody.toString("utf8"),
    signatureHeader,
  );

  if (!isValid) {
    throw new ApiError(401, "Invalid webhook signature");
  }

  const event = JSON.parse(rawBody.toString("utf8"));
  const eventType = event?.data?.attributes?.type;
  const resourceObject = event?.data?.attributes?.data;

  if (eventType === "checkout_session.payment.paid") {
    const order = await findOrderForEvent(resourceObject);

    if (order && order.paymentStatus !== "PAID") {
      order.paymentStatus = "PAID";
      order.paymentGatewayMetadata = resourceObject;

      if (order.orderStatus === "PENDING") {
        order.orderStatus = "PROCESSING";
      }

      await order.save();
    }
  } else if (eventType === "payment.failed") {
    const order = await findOrderForEvent(resourceObject);

    if (order && order.paymentStatus === "PENDING") {
      order.paymentStatus = "FAILED";
      order.paymentGatewayMetadata = resourceObject;

      await order.save();
    }
  }

  return res.status(200).json({ received: true });
});