import apiClient from "./client";

export const initiatePayment = async (orderId) => {
  const response = await apiClient.post("/epayments/initiate", {
    orderId,
  });

  return response.data;
};