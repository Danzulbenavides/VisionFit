import apiClient from "./client";

export type UserRole = "CUSTOMER" | "STAFF" | "ADMIN";

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UsersResponse {
  data?: User[];
  error?: {
    message: string;
  };
}

export const getAdminUsers = async (): Promise<UsersResponse> => {
  const response = await apiClient.get("/users/admin");

  return response.data;
};

export const updateUserStatus = async (
  id: string,
  isActive: boolean,
  reason?: string,
): Promise<User> => {
  const response = await apiClient.patch(`/users/admin/${id}/status`, {
    isActive,
    reason,
  });

  return response.data.data;
};
