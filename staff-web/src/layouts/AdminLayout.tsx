import { NavLink, Outlet, useNavigate } from "react-router-dom";

import NotificationCenter from "../components/NotificationCenter";
import useNotifications from "../hooks/useNotifications";
import { getStoredUser } from "../utils/auth";

interface NavItem {
  label: string;
  path: string;
}

const navigation: NavItem[] = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Products", path: "/products" },
  { label: "Inventory", path: "/inventory" },
  { label: "Orders", path: "/orders" },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  const user = getStoredUser();
  const role = user?.role || "STAFF";

  const {
    notifications,
    unreadCount,
    banners,
    markRead,
    markAllRead,
    dismissBanner,
    enableBrowserAlerts,
  } = useNotifications();


  const handleLogout = () => {
    sessionStorage.removeItem("staffToken");
    sessionStorage.removeItem("staffUser");

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <p>VISIONFIT</p>
          <span>STAFF</span>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-user">
            <strong>{user?.firstName || user?.email || "Staff"}</strong>

            <span>{role}</span>
          </div>

          <button className="sidebar-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <NotificationCenter
          notifications={notifications}
          unreadCount={unreadCount}
          banners={banners}
          onRead={markRead}
          onReadAll={markAllRead}
          onDismissBanner={dismissBanner}
          onEnableBrowserAlerts={enableBrowserAlerts}
        />

        <Outlet />
      </main>
    </div>
  );
}
