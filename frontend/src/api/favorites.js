import apiClient from "./client";

export const getFavorites = async () => {
  const response = await apiClient.get("/favorites");

  return response.data;
};

export const getFavoriteByProduct = async (productId) => {
  const response = await apiClient.get(`/favorites/${productId}`);

  return response.data;
};

export const addFavorite = async (productId) => {
  const response = await apiClient.post(`/favorites/${productId}`);

  return response.data;
};

export const removeFavorite = async (productId) => {
  const response = await apiClient.delete(`/favorites/${productId}`);

  return response.data;
};
