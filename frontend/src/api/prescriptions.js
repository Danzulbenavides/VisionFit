import apiClient from "./client";

export const getPrescriptions = async () => {
  const response = await apiClient.get("/prescriptions");

  return response.data;
};

export const getPrescriptionById = async (id) => {
  const response = await apiClient.get(`/prescriptions/${id}`);

  return response.data;
};

export const createPrescription = async (prescription) => {
  const response = await apiClient.post("/prescriptions", prescription);

  return response.data;
};

export const updatePrescription = async (id, prescription) => {
  const response = await apiClient.patch(`/prescriptions/${id}`, prescription);

  return response.data;
};

export const deletePrescription = async (id) => {
  const response = await apiClient.delete(`/prescriptions/${id}`);

  return response.data;
};
