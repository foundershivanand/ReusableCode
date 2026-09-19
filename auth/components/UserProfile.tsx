import React, { useState } from "react";
import { PublicUser } from "../schemas/auth-schemas.js";

export interface UserProfileProps {
  user: PublicUser;
  onUpdateProfile?: (data: { name?: string; avatarUrl?: string }) => Promise<void>;
  onChangePassword?: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => Promise<void>;
  onRequestEmailChange?: (newEmail: string, currentPassword: string) => Promise<void>;
  onSetupMFA?: () => void;
  onDisableMFA?: (currentPassword: string) => Promise<void>;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onUpdateProfile,
  onChangePassword,
  onRequestEmailChange,
  onSetupMFA,
  onDisableMFA,
}) => {
  const [name, setName] = useState(user.name || "");
  const [activeTab, setActiveTab] = useState<"general" | "security">("general");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Profile update state
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProfile) return;
    try {
      setIsLoading(true);
      setProfileMsg(null);
      await onUpdateProfile({ name: name.trim() });
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onChangePassword) return;
    try {
      setIsLoading(true);
      setPasswordMsg(null);
      await onChangePassword({ currentPassword, newPassword, confirmPassword });
      setPasswordMsg({ type: "success", text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Failed to change password." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRequestEmailChange) return;
    try {
      setIsLoading(true);
      setEmailMsg(null);
      await onRequestEmailChange(newEmail.trim(), emailPassword);
      setEmailMsg({ type: "success", text: "Verification link sent to new email address." });
      setNewEmail("");
      setEmailPassword("");
    } catch (err: any) {
      setEmailMsg({ type: "error", text: err.message || "Failed to request email change." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="User Profile"
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "1.5rem",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
      }}
    >
      <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          style={{
            padding: "0.5rem 1rem",
            border: "none",
            background: "none",
            borderBottom: activeTab === "general" ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === "general" ? "#2563eb" : "#6b7280",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          General
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("security")}
          style={{
            padding: "0.5rem 1rem",
            border: "none",
            background: "none",
            borderBottom: activeTab === "security" ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === "security" ? "#2563eb" : "#6b7280",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Security
        </button>
      </div>

      {activeTab === "general" && (
        <div>
          <form onSubmit={handleUpdateProfile}>
            {profileMsg && (
              <div
                style={{
                  padding: "0.5rem",
                  marginBottom: "1rem",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  backgroundColor: profileMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
                  color: profileMsg.type === "success" ? "#166534" : "#b91c1c",
                }}
              >
                {profileMsg.text}
              </div>
            )}

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#f9fafb",
                  color: "#6b7280",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                }}
              />
              <span style={{ fontSize: "0.75rem", color: user.isEmailVerified ? "#16a34a" : "#ca8a04" }}>
                {user.isEmailVerified ? "✓ Verified" : "⚠ Pending Verification"}
              </span>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
                Account Role
              </label>
              <span
                style={{
                  display: "inline-block",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                  backgroundColor: "#e0e7ff",
                  color: "#3730a3",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                {user.role}
              </span>
            </div>

            {onUpdateProfile && (
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  borderRadius: "6px",
                  border: "none",
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                Save Changes
              </button>
            )}
          </form>
        </div>
      )}

      {activeTab === "security" && (
        <div>
          {/* MFA Section */}
          <div style={{ paddingBottom: "1.5rem", borderBottom: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Two-Factor Authentication</h3>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1rem" }}>
              Status: <strong>{user.mfaEnabled ? "Enabled" : "Disabled"}</strong>
            </p>
            {user.mfaEnabled ? (
              onDisableMFA && (
                <button
                  type="button"
                  onClick={() => {
                    const pwd = prompt("Enter current password to disable MFA:");
                    if (pwd) onDisableMFA(pwd);
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#ef4444",
                    color: "#ffffff",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Disable MFA
                </button>
              )
            ) : (
              onSetupMFA && (
                <button
                  type="button"
                  onClick={onSetupMFA}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Setup MFA
                </button>
              )
            )}
          </div>

          {/* Password Change Section */}
          {onChangePassword && (
            <div style={{ paddingBottom: "1.5rem", borderBottom: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Change Password</h3>
              {passwordMsg && (
                <div
                  style={{
                    padding: "0.5rem",
                    marginBottom: "1rem",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    backgroundColor: passwordMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
                    color: passwordMsg.type === "success" ? "#166534" : "#b91c1c",
                  }}
                >
                  {passwordMsg.text}
                </div>
              )}
              <form onSubmit={handleChangePassword}>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Update Password
                </button>
              </form>
            </div>
          )}

          {/* Email Change Section */}
          {onRequestEmailChange && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Change Email</h3>
              {emailMsg && (
                <div
                  style={{
                    padding: "0.5rem",
                    marginBottom: "1rem",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    backgroundColor: emailMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
                    color: emailMsg.type === "success" ? "#166534" : "#b91c1c",
                  }}
                >
                  {emailMsg.text}
                </div>
              )}
              <form onSubmit={handleRequestEmailChange}>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                    New Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                    Confirm Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Request Email Change
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
