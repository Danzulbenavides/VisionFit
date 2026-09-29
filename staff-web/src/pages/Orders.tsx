import { useCallback, useEffect, useState } from "react";

import {
  getAdminOrders,
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from "../api/orders";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  PENDING: "status-badge status-warning",
  PROCESSING: "status-badge status-warning",
  SHIPPED: "status-badge status-active",
  DELIVERED: "status-badge status-active",
  CANCELLED: "status-badge status-inactive",
};

const formatCurrency = (value: number) => {
  return `₱${Number(value || 0).toLocaleString()}`;
};

const formatDate = (value?: string) => {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
};

const getCustomerName = (order: Order) => {
  if (typeof order.userId === "string") {
    return "Customer";
  }

  const fullName = [order.userId.firstName, order.userId.lastName]
    .filter(Boolean)
    .join(" ");

  return fullName || order.userId.email || "Customer";
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getAdminOrders();

      if (result.error) {
        setError(result.error.message);
        return;
      }

      setOrders(result.data || []);
    } catch (err: any) {
      console.error("Load admin orders error:", err);

      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load orders.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    if (order.orderStatus === newStatus) {
      return;
    }

    try {
      setUpdatingId(order._id);
      setError("");

      const updatedOrder = await updateOrderStatus(order._id, newStatus);

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder._id === updatedOrder._id ? updatedOrder : currentOrder,
        ),
      );
    } catch (err: any) {
      console.error("Update order status error:", err);

      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Unable to update order status.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = orders.filter(
    (order) => order.orderStatus === "PENDING",
  ).length;

  const processingCount = orders.filter(
    (order) => order.orderStatus === "PROCESSING",
  ).length;

  const shippedCount = orders.filter(
    (order) => order.orderStatus === "SHIPPED",
  ).length;

  const deliveredCount = orders.filter(
    (order) => order.orderStatus === "DELIVERED",
  ).length;

  const cancelledCount = orders.filter(
    (order) => order.orderStatus === "CANCELLED",
  ).length;

  const totalSales = orders
    .filter((order) => order.orderStatus !== "CANCELLED")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  return (
    <div className="dashboard-page">
      {/* HEADER */}

      <div className="page-header-row">
        <div>
          <p className="page-eyebrow">ORDERS</p>

          <h1>Orders</h1>

          <p className="page-description">
            View customer orders and manage their status.
          </p>
        </div>

        <button
          className="secondary-admin-button"
          onClick={loadOrders}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* ERROR */}

      {error ? <div className="admin-error">{error}</div> : null}

      {/* SUMMARY */}

      <div className="inventory-summary-grid">
        <div className="inventory-summary-card">
          <span className="inventory-summary-label">Total Orders</span>

          <strong>{orders.length}</strong>
        </div>

        <div className="inventory-summary-card">
          <span className="inventory-summary-label">Pending</span>

          <strong>{pendingCount}</strong>
        </div>

        <div className="inventory-summary-card">
          <span className="inventory-summary-label">Processing</span>

          <strong>{processingCount}</strong>
        </div>

        <div className="inventory-summary-card">
          <span className="inventory-summary-label">Sales</span>

          <strong>{formatCurrency(totalSales)}</strong>
        </div>
      </div>

      {/* ORDER TABLE */}

      {loading ? (
        <div className="admin-loading">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="admin-empty">
          <h2>No orders found</h2>

          <p>There are currently no customer orders.</p>
        </div>
      ) : (
        <div className="product-table-wrapper">
          <table className="product-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Status</th>
                <th>Update Status</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <strong>{order.orderNumber}</strong>
                  </td>

                  <td>
                    <div>
                      <strong>{getCustomerName(order)}</strong>

                      {typeof order.userId !== "string" &&
                      order.userId.email ? (
                        <span>{order.userId.email}</span>
                      ) : null}
                    </div>
                  </td>

                  <td>
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>

                  <td>
                    <strong>{formatCurrency(order.total)}</strong>
                  </td>

                  <td>
                    <div>
                      <strong>{order.paymentMethod}</strong>

                      <span>{order.paymentStatus}</span>
                    </div>
                  </td>

                  <td>{formatDate(order.createdAt)}</td>

                  <td>
                    <span className={ORDER_STATUS_CLASS[order.orderStatus]}>
                      {ORDER_STATUS_LABELS[order.orderStatus]}
                    </span>
                  </td>

                  <td>
                    <select
                      value={order.orderStatus}
                      disabled={updatingId === order._id}
                      onChange={(event) =>
                        handleStatusChange(
                          order,
                          event.target.value as OrderStatus,
                        )
                      }
                    >
                      <option value="PENDING">Pending</option>

                      <option value="PROCESSING">Processing</option>

                      <option value="SHIPPED">Shipped</option>

                      <option value="DELIVERED">Delivered</option>

                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* STATUS SUMMARY */}

      {!loading && orders.length > 0 ? (
        <div className="inventory-status-summary">
          <span>
            Pending: <strong>{pendingCount}</strong>
          </span>

          <span>
            Processing: <strong>{processingCount}</strong>
          </span>

          <span>
            Shipped: <strong>{shippedCount}</strong>
          </span>

          <span>
            Delivered: <strong>{deliveredCount}</strong>
          </span>

          <span>
            Cancelled: <strong>{cancelledCount}</strong>
          </span>
        </div>
      ) : null}
    </div>
  );
}
