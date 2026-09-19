import React, { useEffect } from "react";
import { ChangelogItem } from "../schemas/changelog-schemas.js";

export interface WhatsNewProps {
  isOpen: boolean;
  onClose: () => void;
  items: ChangelogItem[];
  onMarkAsRead: (id: string) => Promise<void>;
}

export const WhatsNew: React.FC<WhatsNewProps> = ({
  isOpen,
  onClose,
  items,
  onMarkAsRead,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || items.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="whats-new-title"
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
          borderRadius: "12px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 id="whats-new-title" style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
              What's New
            </h2>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
              Explore recent product updates and new features
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close What's New modal"
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "#9ca3af",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "1.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {items.map((item) => (
            <article
              key={item.id}
              style={{
                padding: "1.25rem",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.125rem 0.5rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      backgroundColor: item.category === "FEATURE" ? "#dbeafe" : "#fef3c7",
                      color: item.category === "FEATURE" ? "#1e40af" : "#92400e",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {item.category}
                  </span>
                  <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>{item.title}</h3>
                </div>
                {item.versionTag && (
                  <span style={{ fontSize: "0.75rem", color: "#6b7280", fontFamily: "monospace" }}>
                    {item.versionTag}
                  </span>
                )}
              </div>

              <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "#4b5563", lineHeight: 1.5 }}>
                {item.summary}
              </p>

              <button
                type="button"
                onClick={() => onMarkAsRead(item.id)}
                style={{
                  padding: "0.375rem 0.75rem",
                  fontSize: "0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Got it
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
