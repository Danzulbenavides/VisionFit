import apiClient from "./client";

export const createOrder = async ({ addressId, paymentMethod }) => {
  const response = await apiClient.post("/orders", {
    addressId,
    paymentMethod,
  });

  return response.data;
};

export const getOrders = async () => {
  const response = await apiClient.get("/orders");

  return response.data;
};

export const getOrderById = async (id) => {
  const response = await apiClient.get(`/orders/${id}`);

  return response.data;
};
