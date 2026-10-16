import apiClient from "./client";

export type UserRole = "CUSTOMER" | "ADMIN";

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

// SUSPEND START
export interface UserActionResponse {
  data?: User;
  error?: {
    message: string;
  };
}

export const suspendUser = async (id: string): Promise<UserActionResponse> => {
  const response = await apiClient.patch(`/users/admin/${id}/suspend`);

  return response.data;
};

export const reactivateUser = async (
  id: string,
): Promise<UserActionResponse> => {
  const response = await apiClient.patch(`/users/admin/${id}/reactivate`);

  return response.data;
};
// SUSPEND END