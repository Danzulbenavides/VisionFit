import apiClient from "./client";

export interface AuditLogAdmin {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "CUSTOMER";
}

export interface AuditLog {
  _id: string;
  adminId: AuditLogAdmin;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogsResponse {
  data?: AuditLog[];
  error?: {
    message: string;
  } | null;
}

export const getAuditLogs = async (): Promise<AuditLogsResponse> => {
  const response = await apiClient.get("/admin/audit-logs");

  return response.data;
};
