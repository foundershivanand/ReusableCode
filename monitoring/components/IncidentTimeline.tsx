import React from "react";
import { IncidentUpdate } from "../schemas/monitoring-schemas.js";

export interface IncidentTimelineProps {
  updates: IncidentUpdate[];
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ updates }) => {
  if (!updates || updates.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Incident Updates Timeline"
      style={{
        borderLeft: "2px solid #e5e7eb",
        marginLeft: "0.5rem",
        paddingLeft: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      {updates.map((u) => (
        <div key={u.id} style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              left: "-1.35rem",
              top: "0.25rem",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#2563eb",
            }}
          />
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
            <strong style={{ fontSize: "0.75rem", color: "#1f2937" }}>{u.state}</strong>
            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
              {new Date(u.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "#4b5563" }}>
            {u.message}
          </p>
        </div>
      ))}
    </div>
  );
};
