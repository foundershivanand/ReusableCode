import React from "react";
import { useMigrations } from "../client/hooks.js";

export const MigrationStatusTable: React.FC = () => {
  const { migrations, loading, refresh } = useMigrations();

  if (loading) {
    return <p style={{ color: "#6b7280" }}>Loading schema migration history...</p>;
  }

  return (
    <div
      role="region"
      aria-label="Database Migration Status Table"
      style={{
        padding: "1.5rem",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Database Migrations</h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
            Applied schema migrations and cryptographic checksum verification
          </p>
        </div>
        <button
          type="button"
          onClick={() => refresh()}
          style={{
            padding: "0.375rem 0.75rem",
            backgroundColor: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#4b5563" }}>
            <th style={{ padding: "0.5rem" }}>Version</th>
            <th style={{ padding: "0.5rem" }}>Migration Name</th>
            <th style={{ padding: "0.5rem" }}>Checksum</th>
            <th style={{ padding: "0.5rem" }}>Applied At</th>
            <th style={{ padding: "0.5rem" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {migrations.map((m) => (
            <tr key={m.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: "0.5rem", fontFamily: "monospace", fontWeight: 600 }}>{m.version}</td>
              <td style={{ padding: "0.5rem" }}>{m.name}</td>
              <td style={{ padding: "0.5rem", fontFamily: "monospace", color: "#6b7280" }}>
                {m.checksum.substring(0, 8)}...
              </td>
              <td style={{ padding: "0.5rem", color: "#6b7280" }}>
                {new Date(m.appliedAt).toLocaleString()}
              </td>
              <td style={{ padding: "0.5rem" }}>
                <span
                  style={{
                    padding: "0.125rem 0.5rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    backgroundColor: m.status === "APPLIED" ? "#dcfce7" : "#fee2e2",
                    color: m.status === "APPLIED" ? "#166534" : "#b91c1c",
                  }}
                >
                  {m.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
