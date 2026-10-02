import apiClient from "./client";

export const getNotifications = async (limit = 30) => {
  const response = await apiClient.get("/notifications", { params: { limit } });

  return response.data;
};

export const getUnreadCount = async () => {
  const response = await apiClient.get("/notifications/unread-count");

  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await apiClient.patch(`/notifications/${id}/read`);

  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await apiClient.patch("/notifications/read-all");

  return response.data;
};

export const registerPushToken = async (token) => {
  const response = await apiClient.post("/notifications/push-token", { token });

  return response.data;
};

export const removePushToken = async (token) => {
  const response = await apiClient.delete("/notifications/push-token", {
    data: { token },
  });

  return response.data;
};
