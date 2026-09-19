import React, { useState } from "react";
import { useBackups } from "../client/hooks.js";

export const BackupHistoryCard: React.FC = () => {
  const { backups, drConfig, loading, triggerBackup, verifyRestore } = useBackups();
  const [triggering, setTriggering] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const handleTrigger = async () => {
    try {
      setTriggering(true);
      await triggerBackup();
    } finally {
      setTriggering(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      setVerifyingId(id);
      await verifyRestore(id);
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) {
    return <p style={{ color: "#6b7280" }}>Loading backup records...</p>;
  }

  return (
    <div
      role="region"
      aria-label="Database Backups and Disaster Recovery"
      style={{
        padding: "1.5rem",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        marginTop: "1.5rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Backups & Disaster Recovery</h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
            Point-in-time recovery snapshots and restore verification drills
          </p>
        </div>
        <button
          type="button"
          onClick={handleTrigger}
          disabled={triggering}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: triggering ? "not-allowed" : "pointer",
          }}
        >
          {triggering ? "Snapshotting..." : "Trigger Backup"}
        </button>
      </div>

      {drConfig && (
        <div style={{ display: "flex", gap: "1.5rem", padding: "1rem", backgroundColor: "#f8fafc", borderRadius: "6px", marginBottom: "1.25rem", fontSize: "0.875rem" }}>
          <div>
            <span style={{ color: "#64748b" }}>Target RPO: </span>
            <strong>{drConfig.targetRpoMinutes} mins</strong>
          </div>
          <div>
            <span style={{ color: "#64748b" }}>Target RTO: </span>
            <strong>{drConfig.targetRtoMinutes} mins</strong>
          </div>
          <div>
            <span style={{ color: "#64748b" }}>Retention: </span>
            <strong>{drConfig.retentionDays} days</strong>
          </div>
          <div>
            <span style={{ color: "#64748b" }}>Immutable Lock: </span>
            <strong style={{ color: "#16a34a" }}>Active</strong>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {backups.map((b) => (
          <div
            key={b.id}
            style={{
              padding: "1rem",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <strong style={{ fontSize: "0.875rem" }}>{b.backupType}</strong>
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.125rem 0.5rem",
                    borderRadius: "9999px",
                    backgroundColor: b.status === "VERIFIED" ? "#dcfce7" : "#e0e7ff",
                    color: b.status === "VERIFIED" ? "#166534" : "#3730a3",
                    fontWeight: 600,
                  }}
                >
                  {b.status}
                </span>
                {b.encrypted && (
                  <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>🔒 Encrypted</span>
                )}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                Created: {new Date(b.createdAt).toLocaleString()} | Size: {(b.sizeBytes / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>

            <div>
              {b.status !== "VERIFIED" && (
                <button
                  type="button"
                  onClick={() => handleVerify(b.id)}
                  disabled={verifyingId === b.id}
                  style={{
                    padding: "0.375rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "#ffffff",
                    fontSize: "0.8125rem",
                    cursor: verifyingId === b.id ? "not-allowed" : "pointer",
                  }}
                >
                  {verifyingId === b.id ? "Verifying..." : "Run Restore Drill"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
