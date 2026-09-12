import apiClient from "./client";

export const getFaceMeasurements = async () => {
  const response = await apiClient.get("/face-measurements");

  return response.data;
};

export const getFaceMeasurementById = async (id) => {
  const response = await apiClient.get(`/face-measurements/${id}`);

  return response.data;
};

export const createFaceMeasurement = async (measurement) => {
  const response = await apiClient.post("/face-measurements", measurement);

  return response.data;
};

export const deleteFaceMeasurement = async (id) => {
  const response = await apiClient.delete(`/face-measurements/${id}`);

  return response.data;
};
