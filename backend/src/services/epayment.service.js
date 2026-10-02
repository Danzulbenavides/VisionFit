import axios from "axios";
import crypto from "node:crypto";

/*
 * PayMongo integration.
 *
 * Docs used as reference:
 * - Hosted Checkout (v2 sessions): https://developers.paymongo.com/docs/payment-channels-hosted-checkout
 * - Webhook signature verification: https://developers.paymongo.com/docs/securing-webhook
 *
 * v2 checkout sessions defer Payment Intent creation until the
 * customer actually pays, which is the version PayMongo currently
 * recommends for new integrations.
 */

const PAYMONGO_API_BASE = "https://api.paymongo.com/v2";

const getAuthHeader = () => {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYMONGO_SECRET_KEY is not configured");
  }

  const encoded = Buffer.from(`${secretKey}:`).toString("base64");

  return `Basic ${encoded}`;
};

export const createCheckoutSession = async (order) => {
  const lineItems = order.items.map((item) => ({
    name: item.productName,
    amount: Math.round(item.unitPrice * 100),
    currency: "PHP",
    quantity: item.quantity,
  }));

  if (order.shippingFee > 0) {
    lineItems.push({
      name: "Shipping fee",
      amount: Math.round(order.shippingFee * 100),
      currency: "PHP",
      quantity: 1,
    });
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const payload = {
    data: {
      attributes: {
        line_items: lineItems,
        payment_method_types: ["card", "gcash", "paymaya"],
        success_url: `${frontendUrl}/orders/${order._id}?payment=success`,
        cancel_url: `${frontendUrl}/orders/${order._id}?payment=cancelled`,
        reference_number: order.orderNumber,
        description: `VisionFit order ${order.orderNumber}`,
        send_email_receipt: false,
        metadata: {
          orderId: String(order._id),
        },
      },
    },
  };

  const response = await axios.post(
    `${PAYMONGO_API_BASE}/checkout_sessions`,
    payload,
    {
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
    },
  );

  const session = response.data.data;

  return {
    checkoutSessionId: session.id,
    checkoutUrl: session.attributes.checkout_url,
  };
};

export const verifyWebhookSignature = (rawBody, signatureHeader) => {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;

  if (!secret || !signatureHeader) {
    return false;
  }

  const parts = Object.fromEntries(
    signatureHeader
      .split(",")
      .map((part) => part.split("="))
      .filter(([key, value]) => key && value),
  );

  const { t, te, li } = parts;

  if (!t) {
    return false;
  }

  const isLiveMode = process.env.NODE_ENV === "production";
  const providedSignature = isLiveMode ? li : te;

  if (!providedSignature) {
    return false;
  }

  const signedPayload = `${t}.${rawBody}`;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const providedBuffer = Buffer.from(providedSignature, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
};