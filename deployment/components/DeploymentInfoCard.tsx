import React from "react";
import { useDeploymentMetadata } from "../client/hooks.js";

export const DeploymentInfoCard: React.FC = () => {
  const { metadata, loading, refresh } = useDeploymentMetadata();

  if (loading || !metadata) {
    return <p style={{ color: "#6b7280" }}>Loading deployment details...</p>;
  }

  return (
    <div
      role="region"
      aria-label="Deployment Metadata"
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
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Deployment Information</h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
            Immutable release metadata and runtime environment
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>Version</span>
          <div style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>
            {metadata.version}
          </div>
        </div>

        <div>
          <span style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>Environment</span>
          <div style={{ fontSize: "1.125rem", fontWeight: 600, color: "#2563eb" }}>
            {metadata.environment}
          </div>
        </div>

        <div>
          <span style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>Git Commit SHA</span>
          <div style={{ fontSize: "1.125rem", fontWeight: 600, fontFamily: "monospace", color: "#111827" }}>
            {metadata.commitSha.substring(0, 7)}
          </div>
        </div>

        <div>
          <span style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>Runtime</span>
          <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "#4b5563" }}>
            {metadata.runtime}
          </div>
        </div>

        <div>
          <span style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>Database Version</span>
          <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "#4b5563" }}>
            {metadata.databaseVersion}
          </div>
        </div>

        <div>
          <span style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>Deployed At</span>
          <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "#4b5563" }}>
            {new Date(metadata.deployedAt).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
