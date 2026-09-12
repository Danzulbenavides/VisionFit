import apiClient from "./client";

export const getProducts = async (params = {}) => {
  const response = await apiClient.get("/products", {
    params,
  });

  return response.data;
};

export const getProductById = async (id) => {
  const response = await apiClient.get(`/products/${id}`);

  return response.data;
};
