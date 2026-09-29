import apiClient from "./client";

export interface LoginResponse {
  data?: {
    token?: string;
    user?: {
      _id: string;
      email: string;
      role?: string;
      firstName?: string;
      lastName?: string;
    };
  };

  error?: {
    message: string;
  };
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
