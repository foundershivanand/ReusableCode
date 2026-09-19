import React from "react";
import { useEnvironmentConfig } from "../client/hooks.js";

export const EnvironmentConfigTable: React.FC = () => {
  const { configItems, driftFindings, loading } = useEnvironmentConfig();

  if (loading) {
    return <p style={{ color: "#6b7280" }}>Loading configuration parameters...</p>;
  }

  return (
    <div
      role="region"
      aria-label="Environment Configuration and Drift Audit"
      style={{
        padding: "1.5rem",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        marginTop: "1.5rem",
      }}
    >
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem", fontWeight: 700 }}>
        Environment Configuration & Drift Audit
      </h3>
      <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "#6b7280" }}>
        Sensitive secrets are cryptographically masked. Configuration is checked against expected schema.
      </p>

      {/* Drift findings if any */}
      {driftFindings.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.875rem", color: "#b91c1c" }}>
            Configuration Drift Warnings ({driftFindings.length})
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {driftFindings.map((f, idx) => (
              <div
                key={idx}
                style={{
                  padding: "0.75rem",
                  borderRadius: "6px",
                  backgroundColor: f.severity === "CRITICAL" ? "#fee2e2" : "#fef3c7",
                  border: `1px solid ${f.severity === "CRITICAL" ? "#fca5a5" : "#fde68a"}`,
                  fontSize: "0.8125rem",
                  color: f.severity === "CRITICAL" ? "#991b1b" : "#92400e",
                }}
              >
                <strong>{f.key}: </strong>
                <span>{f.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Config table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#4b5563" }}>
            <th style={{ padding: "0.5rem" }}>Variable</th>
            <th style={{ padding: "0.5rem" }}>Type</th>
            <th style={{ padding: "0.5rem" }}>Configured Value</th>
          </tr>
        </thead>
        <tbody>
          {configItems.map((item) => (
            <tr key={item.key} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: "0.5rem", fontFamily: "monospace", fontWeight: 600 }}>{item.key}</td>
              <td style={{ padding: "0.5rem", color: "#6b7280" }}>
                {item.isSecret ? "Secret (Masked)" : "Public"}
              </td>
              <td style={{ padding: "0.5rem", fontFamily: "monospace", color: item.isSecret ? "#9ca3af" : "#111827" }}>
                {item.maskedValue}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
