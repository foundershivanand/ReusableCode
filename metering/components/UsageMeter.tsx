import React from "react";

export interface UsageMeterProps {
  label: string;
  consumed: number;
  limit: number;
  unit?: string;
  warningThresholdPercent?: number;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({
  label,
  consumed,
  limit,
  unit = "units",
  warningThresholdPercent = 80,
}) => {
  const percentage = Math.min(100, Math.max(0, (consumed / (limit || 1)) * 100));
  const isWarning = percentage >= warningThresholdPercent;
  const isOverLimit = consumed >= limit;

  const barColor = isOverLimit ? "#dc2626" : isWarning ? "#f59e0b" : "#2563eb";

  return (
    <div
      role="region"
      aria-label={`${label} usage meter`}
      style={{
        padding: "1rem",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>{label}</span>
        <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          <strong>{consumed.toLocaleString()}</strong> / {limit.toLocaleString()} {unit} ({percentage.toFixed(0)}%)
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={consumed}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-label={`${label} usage progress`}
        style={{
          marginTop: "0.5rem",
          height: "8px",
          width: "100%",
          backgroundColor: "#e5e7eb",
          borderRadius: "9999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percentage}%`,
            backgroundColor: barColor,
            transition: "width 0.3s ease-in-out",
          }}
        />
      </div>

      {isOverLimit && (
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "#dc2626", fontWeight: 500 }}>
          Usage limit exceeded. Additional usage may be throttled or billed as overage.
        </p>
      )}
    </div>
  );
};
