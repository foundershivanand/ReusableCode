import React from "react";
import { useSystemHealth, useSlos } from "../client/hooks.js";

export const HealthDashboard: React.FC = () => {
  const { health, loading, refreshHealth } = useSystemHealth();
  const { slos } = useSlos();

  if (loading || !health) {
    return <p style={{ color: "#6b7280" }}>Loading health dashboard...</p>;
  }

  return (
    <div
      role="region"
      aria-label="Admin Health Dashboard"
      style={{
        padding: "1.5rem",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Internal Health & SLOs</h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
            Real-time dependency telemetry and SLO compliance
          </p>
        </div>
        <button
          type="button"
          onClick={() => refreshHealth()}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          Refresh Probes
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ padding: "1rem", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <span style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>Uptime</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
            {(health.metrics.uptimeSeconds / 3600).toFixed(1)} hrs
          </div>
        </div>

        <div style={{ padding: "1rem", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <span style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>Average Latency</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
            {health.metrics.avgLatencyMs} ms
          </div>
        </div>

        <div style={{ padding: "1rem", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <span style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>Error Rate</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: health.metrics.errorRatePercent > 1 ? "#dc2626" : "#16a34a" }}>
            {health.metrics.errorRatePercent}%
          </div>
        </div>
      </div>

      {/* SLOs */}
      {slos.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>SLO Compliance</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {slos.map((slo) => (
              <div
                key={slo.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.75rem",
                  backgroundColor: "#f9fafb",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  fontSize: "0.875rem",
                }}
              >
                <span>{slo.name}</span>
                <span>
                  <strong>{slo.currentPercentage}%</strong> (Target: {slo.targetPercentage}%) —{" "}
                  <span
                    style={{
                      fontWeight: 600,
                      color: slo.status === "MET" ? "#16a34a" : slo.status === "AT_RISK" ? "#d97706" : "#dc2626",
                    }}
                  >
                    {slo.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
