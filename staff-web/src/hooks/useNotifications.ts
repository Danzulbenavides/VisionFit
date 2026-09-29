import { useCallback, useEffect, useRef, useState } from "react";

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "../api/notifications";

const POLL_MS = 20000;

export default function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [banners, setBanners] = useState<AppNotification[]>([]);

  // ids we already know about, so only NEW ones raise a banner
  const seenIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    try {
      const result = await getNotifications(20);

      if (result.error || !result.data) return;

      const list = result.data.notifications;

      if (!firstLoad.current) {
        const fresh = list.filter(
          (n) => !n.isRead && !seenIds.current.has(n._id),
        );

        if (fresh.length > 0) {
          setBanners((prev) => [...fresh, ...prev].slice(0, 4));

          // Browser (push-style) notification when permission was granted
          if ("Notification" in window && Notification.permission === "granted") {
            fresh.forEach((n) => {
              new Notification(n.title, { body: n.message });
            });
          }
        }
      }

      list.forEach((n) => seenIds.current.add(n._id));
      firstLoad.current = false;

      setNotifications(list);
      setUnreadCount(result.data.unreadCount);
    } catch (error) {
      console.error("Load notifications error:", error);
    }
  }, []);

  useEffect(() => {
    load();

    const timer = window.setInterval(load, POLL_MS);

    return () => window.clearInterval(timer);
  }, [load]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((count) => Math.max(count - 1, 0));

    try {
      await markNotificationRead(id);
    } catch (error) {
      console.error("Mark read error:", error);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
    } catch (error) {
      console.error("Mark all read error:", error);
    }
  }, []);

  const dismissBanner = useCallback((id: string) => {
    setBanners((prev) => prev.filter((n) => n._id !== id));
  }, []);

  const enableBrowserAlerts = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  return {
    notifications,
    unreadCount,
    banners,
    markRead,
    markAllRead,
    dismissBanner,
    enableBrowserAlerts,
  };
}
