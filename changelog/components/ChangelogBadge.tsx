import React from "react";
import { useWhatsNew } from "../client/hooks.js";

export interface ChangelogBadgeProps {
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ChangelogBadge: React.FC<ChangelogBadgeProps> = ({
  onClick,
  className,
  style,
}) => {
  const { hasUnread, unreadCount } = useWhatsNew();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Changelog: ${unreadCount} unread updates`}
      className={className}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.5rem",
        background: "none",
        border: "none",
        cursor: "pointer",
        borderRadius: "6px",
        ...style,
      }}
    >
      <span style={{ fontSize: "1.25rem" }} aria-hidden="true">
        🎁
      </span>

      {hasUnread && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "2px",
            right: "2px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 0.375rem",
            height: "18px",
            minWidth: "18px",
            borderRadius: "9999px",
            backgroundColor: "#dc2626",
            color: "#ffffff",
            fontSize: "0.6875rem",
            fontWeight: 700,
          }}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
};
