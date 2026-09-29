import Notification from "../models/Notification.js";
import User from "../models/User.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD || 5);

// -----------------------------------------
// Send push messages through Expo.
// Failures are logged only, they must never break the request.
// -----------------------------------------
const sendExpoPush = async (tokens, { title, message, data }) => {
  const validTokens = (tokens || []).filter(
    (token) =>
      typeof token === "string" &&
      (token.startsWith("ExponentPushToken[") ||
        token.startsWith("ExpoPushToken[")),
  );

  if (validTokens.length === 0) {
    return;
  }

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        validTokens.map((to) => ({
          to,
          sound: "default",
          title,
          body: message,
          data: data || {},
        })),
      ),
    });

    if (!response.ok) {
      console.error("Expo push failed with status:", response.status);
    }
  } catch (error) {
    console.error("Expo push error:", error.message);
  }
};

// -----------------------------------------
// Notify ONE user (in-app record + push)
// -----------------------------------------
export const notifyUser = async (userId, { type, title, message, data }) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data: data || {},
    });

    const user = await User.findById(userId).select("pushTokens").lean();

    await sendExpoPush(user?.pushTokens, {
      title,
      message,
      data: { ...(data || {}), type, notificationId: notification._id },
    });

    return notification;
  } catch (error) {
    console.error("notifyUser error:", error.message);
    return null;
  }
};

// -----------------------------------------
// Notify every active user with one of the given roles
// (used for ADMIN + STAFF alerts)
// -----------------------------------------
export const notifyRoles = async (roles, payload) => {
  try {
    const users = await User.find({
      role: { $in: roles },
      isActive: true,
    })
      .select("_id")
      .lean();

    await Promise.all(users.map((user) => notifyUser(user._id, payload)));
  } catch (error) {
    console.error("notifyRoles error:", error.message);
  }
};
