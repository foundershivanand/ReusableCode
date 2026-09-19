import React from "react";
import { SystemBanner as SystemBannerType } from "../schemas/maintenance-schemas.js";

export interface SystemBannerProps {
  banner: SystemBannerType;
  onDismiss?: (id: string) => void;
}

export const SystemBanner: React.FC<SystemBannerProps> = ({
  banner,
  onDismiss,
}) => {
  const getBannerStyles = () => {
    switch (banner.type) {
      case "CRITICAL":
      case "MAINTENANCE":
        return { bg: "#fef2f2", border: "#f87171", text: "#991b1b", icon: "🚨" };
      case "WARNING":
      case "BREAKING_UPDATE":
        return { bg: "#fffbeb", border: "#fcd34d", text: "#92400e", icon: "⚠️" };
      case "INFO":
      default:
        return { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af", icon: "ℹ️" };
    }
  };

  const styles = getBannerStyles();

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        padding: "0.75rem 1.25rem",
        backgroundColor: styles.bg,
        borderBottom: `1px solid ${styles.border}`,
        color: styles.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "0.875rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span aria-hidden="true">{styles.icon}</span>
        <div>
          <strong style={{ fontWeight: 600 }}>{banner.title}: </strong>
          <span>{banner.message}</span>
          {banner.actionUrl && (
            <a
              href={banner.actionUrl}
              style={{
                marginLeft: "0.5rem",
                textDecoration: "underline",
                color: styles.text,
                fontWeight: 600,
              }}
            >
              {banner.actionLabel || "Learn more"}
            </a>
          )}
        </div>
      </div>

      {banner.dismissible && onDismiss && (
        <button
          type="button"
          onClick={() => onDismiss(banner.id)}
          aria-label="Dismiss banner"
          style={{
            background: "none",
            border: "none",
            color: styles.text,
            cursor: "pointer",
            fontSize: "1.125rem",
            padding: "0.25rem",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};
