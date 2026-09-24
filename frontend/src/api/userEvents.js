import apiClient from "./client";

export const createUserEvent = async ({
  eventType,
  productId = null,
  orderId = null,
  metadata = {},
}) => {
  const response = await apiClient.post("/events", {
    eventType,
    productId,
    orderId,
    metadata,
  });

  return response.data;
};
