import React, { useState, useEffect } from "react";
import { SecurityFinding, FindingLifecycleState } from "../schemas/security-schemas.js";

export interface FindingDetailModalProps {
  finding: SecurityFinding | null;
  onClose: () => void;
  onUpdateState: (id: string, state: FindingLifecycleState) => Promise<void>;
  onSuppress: (input: { findingId: string; reason: string; owner: string; expirationDays: number; approvedBy: string }) => Promise<void>;
}

export const FindingDetailModal: React.FC<FindingDetailModalProps> = ({
  finding,
  onClose,
  onUpdateState,
  onSuppress,
}) => {
  const [suppressReason, setSuppressReason] = useState("");
  const [suppressOwner, setSuppressOwner] = useState("");
  const [showSuppressForm, setShowSuppressForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && finding) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [finding, onClose]);

  if (!finding) return null;

  const handleSuppress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppressReason || !suppressOwner) return;

    try {
      setSubmitting(true);
      await onSuppress({
        findingId: finding.id,
        reason: suppressReason,
        owner: suppressOwner,
        expirationDays: 90,
        approvedBy: "Security Lead",
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="finding-modal-title"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          width: "100%",
          maxWidth: "560px",
          padding: "1.5rem",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
          <div>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.125rem 0.5rem",
                borderRadius: "9999px",
                fontWeight: 600,
                backgroundColor: finding.severity === "CRITICAL" ? "#fee2e2" : "#fef3c7",
                color: finding.severity === "CRITICAL" ? "#991b1b" : "#92400e",
              }}
            >
              {finding.severity}
            </span>
            <h3 id="finding-modal-title" style={{ margin: "0.5rem 0 0", fontSize: "1.25rem", fontWeight: 700 }}>
              {finding.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#9ca3af" }}
          >
            ×
          </button>
        </div>

        <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "#4b5563", lineHeight: 1.5 }}>
          {finding.description}
        </p>

        <div style={{ marginBottom: "1.25rem", padding: "1rem", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
          <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" }}>
            Remediation Guidance
          </h4>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#334155", lineHeight: 1.4 }}>
            {finding.remediationGuidance}
          </p>
        </div>

        {/* State Transition Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e5e7eb", paddingTop: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {finding.state === "OPEN" && (
              <button
                type="button"
                onClick={() => onUpdateState(finding.id, "IN_PROGRESS")}
                style={{ padding: "0.375rem 0.75rem", borderRadius: "6px", backgroundColor: "#2563eb", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.8125rem" }}
              >
                Mark In Progress
              </button>
            )}
            {finding.state !== "CLOSED" && (
              <button
                type="button"
                onClick={() => onUpdateState(finding.id, "CLOSED")}
                style={{ padding: "0.375rem 0.75rem", borderRadius: "6px", backgroundColor: "#16a34a", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.8125rem" }}
              >
                Mark Resolved
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowSuppressForm(!showSuppressForm)}
            style={{ padding: "0.375rem 0.75rem", borderRadius: "6px", backgroundColor: "#ffffff", border: "1px solid #d1d5db", cursor: "pointer", fontSize: "0.8125rem" }}
          >
            {showSuppressForm ? "Cancel Suppression" : "Suppress (False Positive)"}
          </button>
        </div>

        {/* Suppression Form */}
        {showSuppressForm && (
          <form onSubmit={handleSuppress} style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
            <div style={{ marginBottom: "0.75rem" }}>
              <label htmlFor="suppress-owner" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                Justification Owner
              </label>
              <input
                id="suppress-owner"
                type="text"
                placeholder="Engineer / Team"
                value={suppressOwner}
                onChange={(e) => setSuppressOwner(e.target.value)}
                required
                style={{ width: "100%", padding: "0.375rem", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "0.8125rem" }}
              />
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <label htmlFor="suppress-reason" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                Suppression Reason (min 10 characters)
              </label>
              <textarea
                id="suppress-reason"
                rows={2}
                placeholder="Explain why this finding is safe or mitigated by external controls..."
                value={suppressReason}
                onChange={(e) => setSuppressReason(e.target.value)}
                required
                style={{ width: "100%", padding: "0.375rem", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "0.8125rem" }}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "0.375rem 0.75rem", backgroundColor: "#475569", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8125rem" }}
            >
              {submitting ? "Suppressing..." : "Confirm Suppression"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
