import React from "react";
import { VariantDefinition } from "../schemas/experiment-schemas.js";

export interface VariantTrafficSliderProps {
  variants: VariantDefinition[];
  onChangeWeights: (updated: VariantDefinition[]) => void;
  disabled?: boolean;
}

export const VariantTrafficSlider: React.FC<VariantTrafficSliderProps> = ({
  variants,
  onChangeWeights,
  disabled = false,
}) => {
  const handleWeightChange = (index: number, newWeight: number) => {
    const updated = variants.map((v, idx) =>
      idx === index ? { ...v, weight: newWeight } : v
    );
    onChangeWeights(updated);
  };

  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  const isValidTotal = Math.abs(totalWeight - 100) < 0.01;

  return (
    <div
      role="region"
      aria-label="Variant Traffic Allocation"
      style={{
        padding: "1.25rem",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Traffic Allocation</h4>
        <span
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: isValidTotal ? "#16a34a" : "#dc2626",
          }}
        >
          Total: {totalWeight}% {isValidTotal ? "✓" : "(Must equal 100%)"}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {variants.map((v, idx) => (
          <div key={v.id}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
              <span>
                <strong>{v.name}</strong> {v.isControl && <span style={{ color: "#2563eb" }}>(Control)</span>}
              </span>
              <span>{v.weight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={v.weight}
              disabled={disabled}
              onChange={(e) => handleWeightChange(idx, Number(e.target.value))}
              aria-label={`${v.name} traffic percentage`}
              style={{ width: "100%", cursor: disabled ? "not-allowed" : "pointer" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
