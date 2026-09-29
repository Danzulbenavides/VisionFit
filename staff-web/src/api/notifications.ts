import apiClient from "./client";

export interface AppNotification {
  _id: string;
  type: "ORDER_PLACED" | "ORDER_STATUS" | "NEW_ORDER" | "LOW_STOCK" | "SYSTEM";
  title: string;
  message: string;
  data?: { orderId?: string; productId?: string };
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  data?: { notifications: AppNotification[]; unreadCount: number };
  error?: { message: string };
}

export const getNotifications = async (
  limit = 20,
): Promise<NotificationsResponse> => {
  const response = await apiClient.get("/notifications", { params: { limit } });
  return response.data;
};

export const markNotificationRead = async (id: string) => {
  const response = await apiClient.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await apiClient.patch("/notifications/read-all");
  return response.data;
};
