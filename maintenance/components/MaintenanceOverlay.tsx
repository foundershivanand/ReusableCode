import React from "react";
import { CheckMaintenanceResult } from "../schemas/maintenance-schemas.js";

export interface MaintenanceOverlayProps {
  status: CheckMaintenanceResult;
  onRetry?: () => void;
}

export const MaintenanceOverlay: React.FC<MaintenanceOverlayProps> = ({
  status,
  onRetry,
}) => {
  if (!status.blocked) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="maintenance-overlay-title"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(17, 24, 39, 0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          width: "100%",
          textAlign: "center",
          padding: "2rem",
          borderRadius: "12px",
          backgroundColor: "#1f2937",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }} aria-hidden="true">
          🛠️
        </div>

        <h1
          id="maintenance-overlay-title"
          style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem" }}
        >
          {status.readOnly ? "System In Read-Only Mode" : "Scheduled Maintenance"}
        </h1>

        <p style={{ color: "#9ca3af", fontSize: "1rem", lineHeight: 1.5, margin: "0 0 1.5rem" }}>
          {status.publicMessage || status.reason || "We are currently performing routine system upgrades."}
        </p>

        {status.retryAfterSeconds !== undefined && status.retryAfterSeconds > 0 && (
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "6px",
              backgroundColor: "#374151",
              marginBottom: "1.5rem",
              fontSize: "0.875rem",
              color: "#d1d5db",
            }}
          >
            Estimated completion in ~{Math.ceil(status.retryAfterSeconds / 60)} minutes
          </div>
        )}

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Check Again
          </button>
        )}
      </div>
    </div>
  );
};
