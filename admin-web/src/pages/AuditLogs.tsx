import { useEffect, useState } from "react";

import { getAuditLogs, type AuditLog } from "../api/auditLogs";

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAuditLogs();

      if (response.error) {
        setError(response.error.message);
        return;
      }

      setLogs(response.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">SECURITY</p>
          <h1>Admin Audit Logs</h1>
          <p className="page-description">
            Review recorded administrative actions performed in VisionFit.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={loadAuditLogs}
        >
          Refresh
        </button>
      </div>

      <section className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <p className="page-eyebrow">ACTIVITY LOG</p>
            <h2>Administrative Activity</h2>
          </div>
        </div>

        {loading ? (
          <div className="admin-empty">
            <h3>Loading audit logs...</h3>
            <p>Please wait while the activity records are retrieved.</p>
          </div>
        ) : error ? (
          <div className="admin-empty">
            <h3>Unable to load audit logs</h3>
            <p>{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="admin-empty">
            <h3>No audit activity yet</h3>
            <p>
              Administrative actions will appear here after they are recorded.
            </p>
          </div>
        ) : (
          <div className="product-table-wrapper">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Administrator</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>

                    <td>
                      <strong>
                        {log.adminId?.firstName || "Unknown"}{" "}
                        {log.adminId?.lastName || ""}
                      </strong>
                      <br />
                      <small>{log.adminId?.email || ""}</small>
                    </td>

                    <td>{log.action}</td>

                    <td>{log.resourceType}</td>

                    <td>{log.details || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
