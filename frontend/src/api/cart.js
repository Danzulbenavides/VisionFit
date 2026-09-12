import apiClient from "./client";

export const getCart = async () => {
  const response = await apiClient.get("/cart");

  return response.data;
};

export const addToCart = async ({
  productId,
  quantity,
  lensType,
  prescriptionId = null,
  coating,
}) => {
  const response = await apiClient.post("/cart/items", {
    productId,
    quantity,
    lensType,
    prescriptionId,
    coating,
  });

  return response.data;
};

export const updateCartItem = async (
  productId,
  { quantity, lensType, prescriptionId, coating },
) => {
  const response = await apiClient.patch(`/cart/items/${productId}`, {
    quantity,
    lensType,
    prescriptionId,
    coating,
  });

  return response.data;
};

export const removeCartItem = async (productId) => {
  const response = await apiClient.delete(`/cart/items/${productId}`);

  return response.data;
};

export const clearCart = async () => {
  const response = await apiClient.delete("/cart");

  return response.data;
};
