import { useCallback, useEffect, useState } from "react";

import {
  getAdminUsers,
  suspendUser, // SUSPEND
  reactivateUser, // SUSPEND
  type User,
} from "../api/users";

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Never";
  }

  return new Date(value).toLocaleString();
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // SUSPEND START
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const storedAdmin = sessionStorage.getItem("adminUser");
  const currentAdminId = storedAdmin ? JSON.parse(storedAdmin)?.id : null;
  // SUSPEND END

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getAdminUsers();

      if (result.error) {
        setError(result.error.message);
        return;
      }

      setUsers(result.data || []);
    } catch (err: any) {
      console.error("Load admin users error:", err);

      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load users.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // SUSPEND START
  const handleToggleSuspend = async (user: User) => {
    const willSuspend = user.isActive;

    const confirmed = window.confirm(
      willSuspend
        ? `Suspend ${user.firstName} ${user.lastName}? They will be logged out and cannot log in until reactivated.`
        : `Reactivate ${user.firstName} ${user.lastName}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionUserId(user._id);
      setError("");

      const result = willSuspend
        ? await suspendUser(user._id)
        : await reactivateUser(user._id);

      if (result.error) {
        setError(result.error.message);
        return;
      }

      await loadUsers();
    } catch (err: any) {
      console.error("Suspend/reactivate user error:", err);

      setError(
        err?.response?.data?.error?.message ||
          err?.message ||
          "Unable to update user status.",
      );
    } finally {
      setActionUserId(null);
    }
  };
  // SUSPEND END

  const totalUsers = users.length;

  const customerCount = users.filter((user) => user.role === "CUSTOMER").length;

  const adminCount = users.filter((user) => user.role === "ADMIN").length;

  const activeCount = users.filter((user) => user.isActive).length;

  const inactiveCount = users.filter((user) => !user.isActive).length;

  const verifiedCount = users.filter((user) => user.emailVerified).length;

  return (
    <div className="dashboard-page">
      {/* HEADER */}

      <div className="page-header-row">
        <div>
          <p className="page-eyebrow">USERS</p>

          <h1>Users</h1>

          <p className="page-description">
            View VisionFit customer and administrator accounts.
          </p>
        </div>

        <button
          className="secondary-admin-button"
          onClick={loadUsers}
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
          <span className="inventory-summary-label">Total Users</span>

          <strong>{totalUsers}</strong>

          <span className="inventory-summary-description">
            All registered accounts
          </span>
        </div>

        <div className="inventory-summary-card">
          <span className="inventory-summary-label">Customers</span>

          <strong>{customerCount}</strong>

          <span className="inventory-summary-description">
            Customer accounts
          </span>
        </div>

        <div className="inventory-summary-card">
          <span className="inventory-summary-label">Administrators</span>

          <strong>{adminCount}</strong>

          <span className="inventory-summary-description">Admin accounts</span>
        </div>

        <div className="inventory-summary-card">
          <span className="inventory-summary-label">Active Users</span>

          <strong>{activeCount}</strong>

          <span className="inventory-summary-description">
            Currently active
          </span>
        </div>
      </div>

      {/* USERS TABLE */}

      {loading ? (
        <div className="admin-loading">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="admin-empty">
          <h2>No users found</h2>

          <p>There are currently no registered users.</p>
        </div>
      ) : (
        <div className="product-table-wrapper">
          <table className="product-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div>
                      <strong>
                        {user.firstName} {user.lastName}
                      </strong>

                      <span>{user.email}</span>
                    </div>
                  </td>

                  <td>{user.email}</td>

                  <td>{user.phone || "—"}</td>

                  <td>
                    <span className="status-badge">{user.role}</span>
                  </td>

                  <td>
                    <span
                      className={
                        user.emailVerified
                          ? "status-badge status-active"
                          : "status-badge status-inactive"
                      }
                    >
                      {user.emailVerified ? "Verified" : "Not Verified"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        user.isActive
                          ? "status-badge status-active"
                          : "status-badge status-inactive"
                      }
                    >
                      {user.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>

                  <td>{formatDate(user.lastLoginAt)}</td>

                  <td>{formatDate(user.createdAt)}</td>

                  <td>
                    {user.role === "ADMIN" || user._id === currentAdminId ? (
                      "—"
                    ) : (
                      <button
                        className={
                          user.isActive
                            ? "danger-admin-button"
                            : "secondary-admin-button"
                        }
                        onClick={() => handleToggleSuspend(user)}
                        disabled={actionUserId === user._id}
                      >
                        {actionUserId === user._id
                          ? "Saving..."
                          : user.isActive
                            ? "Suspend"
                            : "Reactivate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FOOTER SUMMARY */}

      {!loading && users.length > 0 ? (
        <div className="inventory-status-summary">
          <span>
            Active: <strong>{activeCount}</strong>
          </span>

          <span>
            Suspended: <strong>{inactiveCount}</strong>
          </span>

          <span>
            Verified: <strong>{verifiedCount}</strong>
          </span>

          <span>
            Unverified: <strong>{totalUsers - verifiedCount}</strong>
          </span>
        </div>
      ) : null}
    </div>
  );
}