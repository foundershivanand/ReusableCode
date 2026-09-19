import React from "react";
import { ActiveSessionInfo } from "../server/session-service.js";

export interface SessionManagerProps {
  sessions: ActiveSessionInfo[];
  isLoading?: boolean;
  onRevokeSession: (sessionId: string) => Promise<void>;
  onRevokeAllOtherSessions?: () => Promise<void>;
  onLogoutAll?: () => Promise<void>;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  sessions,
  isLoading = false,
  onRevokeSession,
  onRevokeAllOtherSessions,
  onLogoutAll,
}) => {
  return (
    <div
      role="region"
      aria-label="Active Sessions Manager"
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "1.5rem",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Active Sessions</h2>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Manage devices where your account is currently signed in.
          </p>
        </div>
        {onRevokeAllOtherSessions && (
          <button
            type="button"
            onClick={onRevokeAllOtherSessions}
            disabled={isLoading || sessions.length <= 1}
            style={{
              padding: "0.4rem 0.75rem",
              backgroundColor: "#ef4444",
              color: "#ffffff",
              borderRadius: "6px",
              border: "none",
              cursor: isLoading || sessions.length <= 1 ? "not-allowed" : "pointer",
              fontSize: "0.75rem",
              fontWeight: 500,
              opacity: isLoading || sessions.length <= 1 ? 0.6 : 1,
            }}
          >
            Sign Out Other Devices
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No active sessions found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {sessions.map((sess) => (
            <div
              key={sess.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #e5e7eb",
                backgroundColor: sess.isCurrent ? "#f0fdf4" : "#ffffff",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>
                    {sess.userAgent || "Unknown Device / Browser"}
                  </span>
                  {sess.isCurrent && (
                    <span
                      style={{
                        padding: "0.125rem 0.375rem",
                        backgroundColor: "#bbf7d0",
                        color: "#166534",
                        borderRadius: "4px",
                        fontSize: "0.625rem",
                        fontWeight: 700,
                      }}
                    >
                      CURRENT
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                  IP: {sess.ipAddress || "Unknown"} · Last active: {new Date(sess.lastActiveAt).toLocaleString()}
                </div>
              </div>

              {!sess.isCurrent && (
                <button
                  type="button"
                  onClick={() => onRevokeSession(sess.id)}
                  disabled={isLoading}
                  style={{
                    padding: "0.375rem 0.625rem",
                    border: "1px solid #d1d5db",
                    backgroundColor: "#ffffff",
                    borderRadius: "4px",
                    color: "#ef4444",
                    fontSize: "0.75rem",
                    cursor: isLoading ? "not-allowed" : "pointer",
                  }}
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {onLogoutAll && (
        <div style={{ marginTop: "1.5rem", borderTop: "1px solid #e5e7eb", paddingTop: "1rem" }}>
          <button
            type="button"
            onClick={onLogoutAll}
            disabled={isLoading}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              borderRadius: "6px",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Sign Out From All Devices Everywhere
          </button>
        </div>
      )}
    </div>
  );
};
