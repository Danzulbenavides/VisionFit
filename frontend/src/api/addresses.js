import apiClient from "./client";

export const getAddresses = async () => {
  const response = await apiClient.get("/addresses");

  return response.data;
};

export const getAddressById = async (id) => {
  const response = await apiClient.get(`/addresses/${id}`);

  return response.data;
};

export const createAddress = async (address) => {
  const response = await apiClient.post("/addresses", address);

  return response.data;
};

export const updateAddress = async (id, address) => {
  const response = await apiClient.patch(`/addresses/${id}`, address);

  return response.data;
};

export const deleteAddress = async (id) => {
  const response = await apiClient.delete(`/addresses/${id}`);

  return response.data;
};
