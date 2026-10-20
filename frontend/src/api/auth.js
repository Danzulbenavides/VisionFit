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

export const forgotPassword = async (email) => {
  const response = await apiClient.post("/auth/forgot-password", {
    email,
  });

  return response.data;
};

export const verifyResetCode = async (email, code) => {
  const response = await apiClient.post("/auth/verify-reset-code", {
    email,
    code,
  });

  return response.data;
};

export const resetPassword = async (email, code, password) => {
  const response = await apiClient.post("/auth/reset-password", {
    email,
    code,
    password,
  });

  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await apiClient.patch("/users/password", {
    currentPassword,
    newPassword,
  });

  return response.data;
};
