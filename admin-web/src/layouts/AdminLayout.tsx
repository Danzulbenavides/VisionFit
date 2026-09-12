import { NavLink, Outlet, useNavigate } from "react-router-dom";

const navigation = [
  {
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    label: "Products",
    path: "/products",
  },
  {
    label: "Inventory",
    path: "/inventory",
  },
  {
    label: "Orders",
    path: "/orders",
  },
  {
    label: "Users",
    path: "/users",
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("adminUser");

  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <p>VISIONFIT</p>
          <span>ADMIN</span>
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
            <strong>{user?.firstName || user?.email || "Administrator"}</strong>

            <span>{user?.role || "ADMIN"}</span>
          </div>

          <button className="sidebar-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
