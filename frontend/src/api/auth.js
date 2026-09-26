import apiClient from "./client";

export const login = async (email, password) => {
  const response = await apiClient.post("/auth/login", {
    email,
    password,
  });

  return response.data;
};

export const register = async (userData) => {
  const response = await apiClient.post("/auth/register", userData);

  return response.data;
};

export const verifyEmail = async (email, code) => {
  const response = await apiClient.post("/auth/verify-email", {
    email,
    code,
  });

  return response.data;
};

export const resendVerification = async (email) => {
  const response = await apiClient.post("/auth/resend-verification", {
    email,
  });

  return response.data;
};
