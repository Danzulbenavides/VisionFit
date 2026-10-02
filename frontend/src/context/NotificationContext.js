import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Platform } from "react-native";

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  registerPushToken,
  removePushToken,
} from "../api/notifications";
import { navigateFromNotification } from "../navigation/navigationRef";
import { useAuth } from "./AuthContext";

const POLL_MS = 30000;

// We draw our own in-app banner while the app is open,
// so the system banner is turned off in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const NotificationContext = createContext(null);

const getPushToken = async () => {
  // Push tokens only exist on real devices
  if (!Device.isDevice) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "VisionFit",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== "granted") return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const result = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  return result.data;
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [banner, setBanner] = useState(null);

  const seenIds = useRef(new Set());
  const firstLoad = useRef(true);
  const pushToken = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const result = await getNotifications(30);

      if (result.error || !result.data) return;

      const list = result.data.notifications;

      if (!firstLoad.current) {
        const fresh = list.find(
          (item) => !item.isRead && !seenIds.current.has(item._id),
        );

        if (fresh) setBanner(fresh);
      }

      list.forEach((item) => seenIds.current.add(item._id));
      firstLoad.current = false;

      setNotifications(list);
      setUnreadCount(result.data.unreadCount);
    } catch (error) {
      console.log("Notification refresh failed:", error.message);
    }
  }, []);

  // ---------- login / logout lifecycle ----------
  useEffect(() => {
    if (!isAuthenticated) {
      // Unlink this device from the account that just logged out
      if (pushToken.current) {
        removePushToken(pushToken.current).catch(() => {});
        pushToken.current = null;
      }

      seenIds.current = new Set();
      firstLoad.current = true;
      setNotifications([]);
      setUnreadCount(0);
      setBanner(null);
      return undefined;
    }

    refresh();

    const timer = setInterval(refresh, POLL_MS);

    getPushToken()
      .then(async (token) => {
        if (!token) return;

        pushToken.current = token;
        await registerPushToken(token);
      })
      .catch((error) => console.log("Push registration failed:", error.message));

    return () => clearInterval(timer);
  }, [isAuthenticated, refresh]);

  // ---------- push received / tapped ----------
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      refresh();
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        refresh();
        navigateFromNotification(
          response.notification.request.content.data || {},
        );
      },
    );

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [isAuthenticated, refresh]);

  const markRead = useCallback(async (id) => {
    setNotifications((previous) =>
      previous.map((item) =>
        item._id === id ? { ...item, isRead: true } : item,
      ),
    );
    setUnreadCount((count) => Math.max(count - 1, 0));

    try {
      await markNotificationRead(id);
    } catch (error) {
      console.log("Mark read failed:", error.message);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((previous) =>
      previous.map((item) => ({ ...item, isRead: true })),
    );
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
    } catch (error) {
      console.log("Mark all read failed:", error.message);
    }
  }, []);

  const dismissBanner = useCallback(() => setBanner(null), []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      banner,
      refresh,
      markRead,
      markAllRead,
      dismissBanner,
    }),
    [notifications, unreadCount, banner, refresh, markRead, markAllRead, dismissBanner],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }

  return context;
};
