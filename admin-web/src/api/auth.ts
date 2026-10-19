import apiClient from "./client";

export interface AuthUser {
  _id: string;
  email: string;
  role?: string;
  firstName?: string;
  lastName?: string;
}

export interface ApiError {
  message: string;
  attemptsRemaining?: number;
  retryAfterSeconds?: number;
}

export interface LoginResponse {
  data?: {
    token?: string;
    requiresPin?: boolean;
    challenge?: string;
    user?: AuthUser;
  };

  error?: ApiError;
}

export interface PinChallengeResponse {
  data?: {
    token?: string;
    user?: AuthUser;
  };

  error?: ApiError;
}

export interface MessageResponse {
  data?: {
    message?: string;
    email?: string;
    recoveryEmail?: string;
    verified?: boolean;
    reset?: boolean;
  };

  error?: ApiError;
}

export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  const response = await apiClient.post("/auth/login", {
    email,
    password,
  });

  return response.data;
};

export const verifyPin = async (
  challenge: string,
  pin: string,
): Promise<PinChallengeResponse> => {
  const response = await apiClient.post("/auth/verify-pin", {
    challenge,
    pin,
  });

  return response.data;
};

export const forgotPin = async (
  accountEmail: string,
  recoveryEmail: string,
): Promise<MessageResponse> => {
  const response = await apiClient.post("/auth/forgot-pin", {
    email: accountEmail,
    recoveryEmail,
  });

  return response.data;
};

export const verifyPinCode = async (
  email: string,
  code: string,
): Promise<MessageResponse> => {
  const response = await apiClient.post("/auth/verify-pin-code", {
    email,
    code,
  });

  return response.data;
};

export const resetPin = async (
  email: string,
  code: string,
  pin: string,
): Promise<MessageResponse> => {
  const response = await apiClient.post("/auth/reset-pin", {
    email,
    code,
    pin,
  });

  return response.data;
};
