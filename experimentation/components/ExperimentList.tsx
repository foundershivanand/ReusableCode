import React from "react";
import { Experiment } from "../schemas/experiment-schemas.js";

export interface ExperimentListProps {
  experiments: Experiment[];
  onSelectExperiment?: (exp: Experiment) => void;
}

export const ExperimentList: React.FC<ExperimentListProps> = ({
  experiments,
  onSelectExperiment,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RUNNING":
        return { bg: "#dcfce7", text: "#166534" };
      case "PAUSED":
        return { bg: "#fef3c7", text: "#92400e" };
      case "COMPLETED":
        return { bg: "#e0e7ff", text: "#3730a3" };
      case "ARCHIVED":
        return { bg: "#f3f4f6", text: "#6b7280" };
      case "DRAFT":
      default:
        return { bg: "#f1f5f9", text: "#475569" };
    }
  };

  return (
    <div
      role="region"
      aria-label="Experimentation Dashboard"
      style={{
        padding: "1.5rem",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      }}
    >
      <h2 style={{ margin: "0 0 1rem", fontSize: "1.25rem", fontWeight: 700 }}>
        A/B Experiments
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {experiments.map((exp) => {
          const badge = getStatusBadge(exp.status);
          return (
            <div
              key={exp.id}
              onClick={() => onSelectExperiment && onSelectExperiment(exp)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" && onSelectExperiment) onSelectExperiment(exp);
              }}
              style={{
                padding: "1rem",
                borderRadius: "6px",
                border: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
                cursor: onSelectExperiment ? "pointer" : "default",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <strong style={{ fontSize: "1rem" }}>{exp.name}</strong>
                  <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#6b7280" }}>
                    ({exp.key})
                  </span>
                </div>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#4b5563" }}>
                  {exp.description}
                </p>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", fontSize: "0.75rem", color: "#6b7280" }}>
                  <span>Metric: <strong>{exp.primaryMetric}</strong></span>
                  <span>Variants: <strong>{exp.variants.length}</strong></span>
                  {exp.mutualExclusionGroup && (
                    <span>Group: <strong>{exp.mutualExclusionGroup}</strong></span>
                  )}
                </div>
              </div>

              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.625rem",
                  borderRadius: "9999px",
                  fontWeight: 600,
                  backgroundColor: badge.bg,
                  color: badge.text,
                }}
              >
                {exp.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
