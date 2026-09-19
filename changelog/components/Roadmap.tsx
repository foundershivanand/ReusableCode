import React from "react";
import { useRoadmap } from "../client/hooks.js";

export interface RoadmapProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Roadmap: React.FC<RoadmapProps> = ({
  className,
  style,
}) => {
  const { roadmapItems, upvoteRoadmap } = useRoadmap();

  return (
    <div
      role="region"
      aria-label="Product Roadmap"
      className={className}
      style={{
        padding: "1.5rem",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        ...style,
      }}
    >
      <h2 style={{ margin: "0 0 1.5rem", fontSize: "1.5rem", fontWeight: 700 }}>
        Product Roadmap
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        {roadmapItems.map((item) => (
          <div
            key={item.id}
            style={{
              padding: "1.25rem",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280" }}>
                  {item.targetQuarter}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.125rem 0.5rem",
                    borderRadius: "9999px",
                    backgroundColor: item.status === "COMPLETED" ? "#dcfce7" : "#e0e7ff",
                    color: item.status === "COMPLETED" ? "#166534" : "#3730a3",
                    fontWeight: 500,
                  }}
                >
                  {item.status}
                </span>
              </div>

              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem", fontWeight: 600 }}>
                {item.title}
              </h3>
              <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "#4b5563" }}>
                {item.description}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => upvoteRoadmap(item.id)}
                aria-label={`Upvote ${item.title}, currently has ${item.upvotesCount} upvotes`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.375rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                <span aria-hidden="true">▲</span>
                <strong>{item.upvotesCount}</strong>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
