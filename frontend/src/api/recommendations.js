import apiClient from "./client";

export const getRecommendations = async () => {
  const response = await apiClient.get("/recommendations");

  return response.data;
};
