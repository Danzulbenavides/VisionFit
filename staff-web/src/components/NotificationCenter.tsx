import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { AppNotification } from "../api/notifications";

interface Props {
  notifications: AppNotification[];
  unreadCount: number;
  banners: AppNotification[];
  onRead: (id: string) => void;
  onReadAll: () => void;
  onDismissBanner: (id: string) => void;
  onEnableBrowserAlerts: () => void;
}

const timeAgo = (value: string) => {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
};

const routeFor = (n: AppNotification) => {
  if (n.type === "LOW_STOCK") return "/inventory";
  if (n.type === "NEW_ORDER" || n.type === "ORDER_STATUS") return "/orders";
  return null;
};

function Banner({
  item,
  onClose,
}: {
  item: AppNotification;
  onClose: (id: string) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onClose(item._id), 6000);
    return () => window.clearTimeout(timer);
  }, [item._id, onClose]);

  const tone = item.type === "LOW_STOCK" ? "banner-warning" : "banner-info";

  return (
    <div className={`alert-banner ${tone}`} role="alert">
      <div>
        <strong>{item.title}</strong>
        <p>{item.message}</p>
      </div>
      <button aria-label="Dismiss" onClick={() => onClose(item._id)}>
        ×
      </button>
    </div>
  );
}

export default function NotificationCenter({
  notifications,
  unreadCount,
  banners,
  onRead,
  onReadAll,
  onDismissBanner,
  onEnableBrowserAlerts,
}: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleClick = (n: AppNotification) => {
    if (!n.isRead) onRead(n._id);

    const route = routeFor(n);
    if (route) {
      setOpen(false);
      navigate(route);
    }
  };

  return (
    <>
      <div className="alert-banner-stack">
        {banners.map((item) => (
          <Banner key={item._id} item={item} onClose={onDismissBanner} />
        ))}
      </div>

      <div className="notif-wrapper">
        <button
          className="notif-bell"
          onClick={() => {
            setOpen((value) => !value);
            onEnableBrowserAlerts();
          }}
          aria-label="Notifications"
        >
          🔔
          {unreadCount > 0 ? (
            <span className="notif-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>

        {open ? (
          <div className="notif-panel">
            <div className="notif-panel-header">
              <strong>Notifications</strong>
              <button onClick={onReadAll} disabled={unreadCount === 0}>
                Mark all read
              </button>
            </div>

            {notifications.length === 0 ? (
              <p className="notif-empty">No notifications yet.</p>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li
                    key={n._id}
                    className={n.isRead ? "notif-item" : "notif-item notif-unread"}
                    onClick={() => handleClick(n)}
                  >
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    <span>{timeAgo(n.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
