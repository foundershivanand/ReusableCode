import React, { useState } from "react";
import { useSecurityFindings, useSecurityScore, useSecurityEvents } from "../client/hooks.js";
import { SecurityScoreCard } from "./SecurityScoreCard.js";
import { FindingDetailModal } from "./FindingDetailModal.js";
import { SecurityFinding } from "../schemas/security-schemas.js";

export const SecurityDashboard: React.FC = () => {
  const { findings, loading: findingsLoading, updateFindingState, suppressFinding } = useSecurityFindings();
  const { score, loading: scoreLoading } = useSecurityScore();
  const { events } = useSecurityEvents();
  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(null);

  return (
    <div
      role="region"
      aria-label="Security Center Dashboard"
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "1.5rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.75rem", fontWeight: 800 }}>
          Security Center
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
          Automated security posture, technical compliance baseline, and vulnerability remediation
        </p>
      </header>

      {/* Posture Score Card */}
      <SecurityScoreCard score={score} loading={scoreLoading} />

      {/* Findings Section */}
      <section style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
          Security Findings ({findings.length})
        </h2>

        {findingsLoading ? (
          <p style={{ color: "#6b7280" }}>Loading findings...</p>
        ) : findings.length === 0 ? (
          <div style={{ padding: "1.5rem", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#166534" }}>
            ✓ No open security findings detected. Technical configuration matches security baseline.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {findings.map((f) => (
              <div
                key={f.id}
                onClick={() => setSelectedFinding(f)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSelectedFinding(f);
                }}
                style={{
                  padding: "1rem",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        padding: "0.125rem 0.375rem",
                        borderRadius: "4px",
                        backgroundColor:
                          f.severity === "CRITICAL"
                            ? "#fee2e2"
                            : f.severity === "HIGH"
                            ? "#ffedd5"
                            : "#fef9c3",
                        color:
                          f.severity === "CRITICAL"
                            ? "#991b1b"
                            : f.severity === "HIGH"
                            ? "#9a3412"
                            : "#854d0e",
                      }}
                    >
                      {f.severity}
                    </span>
                    <strong style={{ fontSize: "0.9375rem" }}>{f.title}</strong>
                  </div>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "#4b5563" }}>
                    {f.description}
                  </p>
                </div>

                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280" }}>
                  {f.state}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Security Events */}
      <section style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
          Recent Security Events
        </h2>
        <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          {events.map((evt, idx) => (
            <div
              key={evt.id}
              style={{
                padding: "0.75rem 1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: idx < events.length - 1 ? "1px solid #f3f4f6" : "none",
                fontSize: "0.8125rem",
              }}
            >
              <div>
                <strong>{evt.eventType}</strong> — <span style={{ color: "#6b7280" }}>Actor: {evt.actorId} ({evt.ipAddress})</span>
              </div>
              <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>
                {new Date(evt.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Finding Detail Modal */}
      <FindingDetailModal
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
        onUpdateState={updateFindingState}
        onSuppress={suppressFinding}
      />
    </div>
  );
};
