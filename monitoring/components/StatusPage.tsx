import React from "react";
import { useSystemHealth, useIncidents } from "../client/hooks.js";
import { IncidentTimeline } from "./IncidentTimeline.js";

export const StatusPage: React.FC = () => {
  const { health, loading } = useSystemHealth();
  const { incidents } = useIncidents();

  if (loading || !health) {
    return (
      <div role="status" aria-live="polite" style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "#6b7280" }}>Checking system status...</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return { bg: "#dcfce7", text: "#166534", label: "All Systems Operational" };
      case "DEGRADED":
        return { bg: "#fef3c7", text: "#92400e", label: "Degraded Performance" };
      case "UNHEALTHY":
      default:
        return { bg: "#fee2e2", text: "#b91c1c", label: "Major Service Outage" };
    }
  };

  const statusInfo = getStatusColor(health.status);
  const activeIncidents = incidents.filter((i) => i.state !== "RESOLVED" && i.state !== "POSTMORTEM");

  return (
    <div
      role="region"
      aria-label="System Status Page"
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "2rem 1rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <header style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.875rem", fontWeight: 800 }}>
          System Status
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
          Current operational status and real-time incident reports
        </p>
      </header>

      {/* Main Status Banner */}
      <div
        style={{
          padding: "1.5rem",
          borderRadius: "8px",
          backgroundColor: statusInfo.bg,
          color: statusInfo.text,
          textAlign: "center",
          fontWeight: 700,
          fontSize: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {statusInfo.label}
      </div>

      {/* Services List */}
      <section style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>Services</h2>
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
        >
          {health.dependencies.map((dep, idx) => (
            <div
              key={dep.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 1.25rem",
                borderBottom: idx < health.dependencies.length - 1 ? "1px solid #f3f4f6" : "none",
              }}
            >
              <span style={{ fontWeight: 500, color: "#1f2937" }}>{dep.name}</span>
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color:
                    dep.status === "HEALTHY"
                      ? "#16a34a"
                      : dep.status === "DEGRADED"
                      ? "#d97706"
                      : "#dc2626",
                }}
              >
                {dep.message || dep.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>
            Active Incidents
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {activeIncidents.map((inc) => (
              <div
                key={inc.id}
                style={{
                  padding: "1.25rem",
                  borderRadius: "8px",
                  border: "1px solid #fca5a5",
                  backgroundColor: "#fff5f5",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <strong style={{ fontSize: "1rem", color: "#991b1b" }}>{inc.title}</strong>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#991b1b" }}>{inc.state}</span>
                </div>
                <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "#7f1d1d" }}>
                  {inc.publicMessage}
                </p>
                <IncidentTimeline updates={inc.updates} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
