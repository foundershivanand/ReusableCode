import React from "react";
import { DnsChallenge } from "../schemas/domain-schemas.js";

export interface DnsInstructionsCardProps {
  challenges: DnsChallenge[];
}

export const DnsInstructionsCard: React.FC<DnsInstructionsCardProps> = ({
  challenges,
}) => {
  return (
    <div
      role="region"
      aria-label="DNS Configuration Instructions"
      style={{
        marginTop: "0.75rem",
        padding: "0.75rem",
        borderRadius: "6px",
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
      }}
    >
      <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
        Required DNS Records
      </h4>
      <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", color: "#64748b" }}>
        Add the following records in your domain registrar's DNS settings:
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", textAlign: "left" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #cbd5e1", color: "#475569" }}>
            <th style={{ padding: "0.25rem 0.5rem" }}>Type</th>
            <th style={{ padding: "0.25rem 0.5rem" }}>Name</th>
            <th style={{ padding: "0.25rem 0.5rem" }}>Expected Value</th>
          </tr>
        </thead>
        <tbody>
          {challenges.map((c, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "0.375rem 0.5rem", fontWeight: 600, fontFamily: "monospace" }}>{c.recordType}</td>
              <td style={{ padding: "0.375rem 0.5rem", fontFamily: "monospace", color: "#0f172a" }}>{c.name}</td>
              <td style={{ padding: "0.375rem 0.5rem", fontFamily: "monospace", color: "#0f172a", wordBreak: "break-all" }}>
                {c.expectedValue}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
