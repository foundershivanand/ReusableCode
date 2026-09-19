import React from "react";
import { SecurityPostureScore } from "../schemas/security-schemas.js";

export interface SecurityScoreCardProps {
  score: SecurityPostureScore | null;
  loading?: boolean;
}

export const SecurityScoreCard: React.FC<SecurityScoreCardProps> = ({
  score,
  loading = false,
}) => {
  if (loading || !score) {
    return <p style={{ color: "#6b7280" }}>Evaluating security posture...</p>;
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "#16a34a";
      case "B":
        return "#2563eb";
      case "C":
        return "#d97706";
      case "D":
        return "#ea580c";
      case "F":
      default:
        return "#dc2626";
    }
  };

  const gradeColor = getGradeColor(score.grade);

  return (
    <div
      role="region"
      aria-label="Security Posture Score"
      style={{
        padding: "1.5rem",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Security Posture</h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
            Real-time configuration audit and vulnerability metrics
          </p>
        </div>

        <div
          aria-label={`Security Grade: ${score.grade} (${score.overallScore} out of 100)`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: `${gradeColor}15`,
            border: `2px solid ${gradeColor}`,
            fontSize: "1.75rem",
            fontWeight: 800,
            color: gradeColor,
          }}
        >
          {score.grade}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem", marginTop: "1.5rem" }}>
        <div style={{ padding: "0.75rem", backgroundColor: "#f9fafb", borderRadius: "6px", textAlign: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>Score</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: gradeColor }}>
            {score.overallScore}
          </div>
        </div>

        <div style={{ padding: "0.75rem", backgroundColor: "#fef2f2", borderRadius: "6px", textAlign: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "#991b1b", textTransform: "uppercase" }}>Critical</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#991b1b" }}>
            {score.criticalCount}
          </div>
        </div>

        <div style={{ padding: "0.75rem", backgroundColor: "#fff7ed", borderRadius: "6px", textAlign: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "#9a3412", textTransform: "uppercase" }}>High</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#9a3412" }}>
            {score.highCount}
          </div>
        </div>

        <div style={{ padding: "0.75rem", backgroundColor: "#fefce8", borderRadius: "6px", textAlign: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "#854d0e", textTransform: "uppercase" }}>Medium</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#854d0e" }}>
            {score.mediumCount}
          </div>
        </div>

        <div style={{ padding: "0.75rem", backgroundColor: "#eff6ff", borderRadius: "6px", textAlign: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "#1e40af", textTransform: "uppercase" }}>MFA Adoption</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1e40af" }}>
            {score.mfaAdoptionPercent}%
          </div>
        </div>
      </div>
    </div>
  );
};
