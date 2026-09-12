import { useCallback, useEffect, useState } from "react";

import { getProducts } from "../api/products";
import { getAdminOrders, type Order } from "../api/orders";
import { getAdminUsers, type User } from "../api/users";

const LOW_STOCK_THRESHOLD = 5;

const formatCurrency = (value: number) => {
  return `₱${Number(value || 0).toLocaleString()}`;
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [productCount, setProductCount] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [productsResult, ordersResult, usersResult] = await Promise.all([
        getProducts({
          search: "",
          category: "",
          frameShape: "",
          material: "",
          genderCategory: "",
          minPrice: "",
          maxPrice: "",
          minStock: "",
          sort: "newest",
          page: 1,
          limit: 100,
        }),

        getAdminOrders(),

        getAdminUsers(),
      ]);

      // -----------------------------------------
      // PRODUCTS
      // -----------------------------------------

      if (productsResult.error) {
        throw new Error(productsResult.error.message);
      }

      const products = productsResult.data?.products || [];

      setProductCount(productsResult.data?.pagination.total || products.length);

      setTotalUnits(
        products.reduce((sum, product) => sum + (product.stock ?? 0), 0),
      );

      setLowStockCount(
        products.filter(
          (product) =>
            (product.stock ?? 0) > 0 &&
            (product.stock ?? 0) <= LOW_STOCK_THRESHOLD,
        ).length,
      );

      // -----------------------------------------
      // ORDERS
      // -----------------------------------------

      if (ordersResult.error) {
        throw new Error(ordersResult.error.message);
      }

      setOrders(ordersResult.data || []);

      // -----------------------------------------
      // USERS
      // -----------------------------------------

      if (usersResult.error) {
        throw new Error(usersResult.error.message);
      }

      setUsers(usersResult.data || []);
    } catch (err: any) {
      console.error("Load dashboard error:", err);

      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // -----------------------------------------
  // ORDER METRICS
  // -----------------------------------------

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) => order.orderStatus === "PENDING",
  ).length;

  const processingOrders = orders.filter(
    (order) => order.orderStatus === "PROCESSING",
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.orderStatus === "DELIVERED",
  ).length;

  const cancelledOrders = orders.filter(
    (order) => order.orderStatus === "CANCELLED",
  ).length;

  const totalSales = orders
    .filter((order) => order.orderStatus !== "CANCELLED")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  // -----------------------------------------
  // USER METRICS
  // -----------------------------------------

  const totalUsers = users.length;

  const activeUsers = users.filter((user) => user.isActive).length;

  const customerCount = users.filter((user) => user.role === "CUSTOMER").length;

  // -----------------------------------------
  // RECENT ORDERS
  // -----------------------------------------

  const recentOrders = [...orders]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();

      const dateB = new Date(b.createdAt || 0).getTime();

      return dateB - dateA;
    })
    .slice(0, 5);

  return (
    <div className="dashboard-page">
      {/* HEADER */}

      <div className="page-header-row">
        <div>
          <p className="page-eyebrow">OVERVIEW</p>

          <h1>Dashboard</h1>

          <p className="page-description">
            Overview of VisionFit products, orders, inventory, and users.
          </p>
        </div>

        <button
          className="secondary-admin-button"
          onClick={loadDashboard}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* ERROR */}

      {error ? <div className="admin-error">{error}</div> : null}

      {/* PRIMARY METRICS */}

      <div className="inventory-summary-grid">
        <div className="inventory-summary-card">
          <span className="inventory-summary-label">Products</span>

          <strong>{productCount}</strong>

          <span className="inventory-summary-description">
            Active catalog products
          </span>
        </div>

        <div className="inventory-summary-card">
          <span className="inventory-summary-label">Orders</span>

          <strong>{totalOrders}</strong>

          <span className="inventory-summary-description">
            Total customer orders
          </span>
        </div>

        <div className="inventory-summary-card">
          <span className="inventory-summary-label">Users</span>

          <strong>{totalUsers}</strong>

          <span className="inventory-summary-description">
            Registered accounts
          </span>
        </div>

        <div className="inventory-summary-card">
          <span className="inventory-summary-label">Sales</span>

          <strong>{formatCurrency(totalSales)}</strong>

          <span className="inventory-summary-description">
            Excluding cancelled orders
          </span>
        </div>
      </div>

      {/* SECONDARY METRICS */}

      <div className="dashboard-section-grid">
        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <p className="page-eyebrow">INVENTORY</p>

              <h2>Stock Overview</h2>
            </div>
          </div>

          <div className="dashboard-metric-list">
            <div className="dashboard-metric-row">
              <span>Total units</span>

              <strong>{totalUnits}</strong>
            </div>

            <div className="dashboard-metric-row">
              <span>Low stock</span>

              <strong>{lowStockCount}</strong>
            </div>
          </div>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <p className="page-eyebrow">USERS</p>

              <h2>User Overview</h2>
            </div>
          </div>

          <div className="dashboard-metric-list">
            <div className="dashboard-metric-row">
              <span>Customers</span>

              <strong>{customerCount}</strong>
            </div>

            <div className="dashboard-metric-row">
              <span>Active users</span>

              <strong>{activeUsers}</strong>
            </div>
          </div>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <p className="page-eyebrow">ORDERS</p>

              <h2>Order Overview</h2>
            </div>
          </div>

          <div className="dashboard-metric-list">
            <div className="dashboard-metric-row">
              <span>Pending</span>

              <strong>{pendingOrders}</strong>
            </div>

            <div className="dashboard-metric-row">
              <span>Processing</span>

              <strong>{processingOrders}</strong>
            </div>

            <div className="dashboard-metric-row">
              <span>Delivered</span>

              <strong>{deliveredOrders}</strong>
            </div>

            <div className="dashboard-metric-row">
              <span>Cancelled</span>

              <strong>{cancelledOrders}</strong>
            </div>
          </div>
        </section>
      </div>

      {/* RECENT ORDERS */}

      <section className="dashboard-card dashboard-recent-orders">
        <div className="dashboard-card-header">
          <div>
            <p className="page-eyebrow">ACTIVITY</p>

            <h2>Recent Orders</h2>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">Loading recent orders...</div>
        ) : recentOrders.length === 0 ? (
          <div className="admin-empty">
            <h3>No orders yet</h3>

            <p>Customer orders will appear here once they are created.</p>
          </div>
        ) : (
          <div className="product-table-wrapper">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <strong>{order.orderNumber}</strong>
                    </td>

                    <td>{formatCurrency(order.total)}</td>

                    <td>
                      <div>
                        <strong>{order.paymentMethod}</strong>

                        <span>{order.paymentStatus}</span>
                      </div>
                    </td>

                    <td>
                      <span className="status-badge">{order.orderStatus}</span>
                    </td>

                    <td>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
