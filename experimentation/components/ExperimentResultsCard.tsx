import React from "react";
import { RawMetricsReport } from "../schemas/experiment-schemas.js";

export interface ExperimentResultsCardProps {
  report: RawMetricsReport;
}

export const ExperimentResultsCard: React.FC<ExperimentResultsCardProps> = ({
  report,
}) => {
  return (
    <div
      role="region"
      aria-label="Experiment Results"
      style={{
        padding: "1.5rem",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        marginTop: "1.5rem",
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.25rem", fontWeight: 700 }}>
          Experiment Results: {report.experimentKey}
        </h3>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>
          Primary Metric: <strong>{report.primaryMetric}</strong>
        </p>
      </div>

      {report.srmDetected && (
        <div
          role="alert"
          style={{
            padding: "0.75rem",
            backgroundColor: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: "6px",
            color: "#991b1b",
            fontSize: "0.875rem",
            marginBottom: "1rem",
          }}
        >
          <strong>⚠️ Sample-Ratio Mismatch (SRM) Detected:</strong> The observed assignment distribution differs significantly from expected weights. Investigate tracking or traffic allocation errors.
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left", marginBottom: "1rem" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#4b5563" }}>
            <th style={{ padding: "0.5rem" }}>Variant</th>
            <th style={{ padding: "0.5rem" }}>Target %</th>
            <th style={{ padding: "0.5rem" }}>Assigned</th>
            <th style={{ padding: "0.5rem" }}>Exposed</th>
            <th style={{ padding: "0.5rem" }}>Conversions</th>
            <th style={{ padding: "0.5rem" }}>Conv. Rate</th>
            <th style={{ padding: "0.5rem" }}>Std. Error</th>
          </tr>
        </thead>
        <tbody>
          {report.variantMetrics.map((vm) => (
            <tr key={vm.variantId} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: "0.5rem", fontWeight: 600 }}>
                {vm.variantName} {vm.isControl && <span style={{ color: "#2563eb" }}>(Control)</span>}
              </td>
              <td style={{ padding: "0.5rem", color: "#6b7280" }}>{vm.weight}%</td>
              <td style={{ padding: "0.5rem" }}>{vm.assignedCount.toLocaleString()}</td>
              <td style={{ padding: "0.5rem" }}>{vm.exposedCount.toLocaleString()}</td>
              <td style={{ padding: "0.5rem" }}>{vm.conversionsCount.toLocaleString()}</td>
              <td style={{ padding: "0.5rem", fontWeight: 700 }}>
                {(vm.conversionRate * 100).toFixed(2)}%
              </td>
              <td style={{ padding: "0.5rem", color: "#6b7280" }}>
                ±{(vm.standardError * 100).toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280", fontStyle: "italic" }}>
        {report.methodologyNote}
      </p>
    </div>
  );
};
