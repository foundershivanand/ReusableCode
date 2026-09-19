import React, { useState } from "react";
import { PasswordResetInput, PasswordResetSchema } from "../schemas/auth-schemas.js";

export interface ResetPasswordProps {
  token?: string;
  onSubmit: (data: PasswordResetInput) => Promise<void>;
  onSuccessRedirect?: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({
  token = "",
  onSubmit,
  onSuccessRedirect,
}) => {
  const [resetToken, setResetToken] = useState(token);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = PasswordResetSchema.safeParse({
      token: resetToken,
      newPassword,
      confirmPassword,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Invalid input");
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(validation.data);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div
        role="region"
        aria-label="Password Reset Success"
        style={{
          maxWidth: "400px",
          margin: "0 auto",
          padding: "1.5rem",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          backgroundColor: "#ffffff",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#16a34a", marginBottom: "0.5rem" }}>
          Password Reset Complete
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#4b5563", marginBottom: "1.5rem" }}>
          Your password has been successfully updated. All other active sessions have been securely invalidated.
        </p>
        {onSuccessRedirect && (
          <button
            type="button"
            onClick={onSuccessRedirect}
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
            Sign in with new password
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Reset Password Form"
      style={{
        maxWidth: "400px",
        margin: "0 auto",
        padding: "1.5rem",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Set New Password</h2>

      {error && (
        <div
          role="alert"
          style={{
            padding: "0.75rem",
            marginBottom: "1rem",
            backgroundColor: "#fef2f2",
            border: "1px solid #f87171",
            borderRadius: "6px",
            color: "#b91c1c",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {!token && (
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="reset-token"
              style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}
            >
              Reset Token
            </label>
            <input
              id="reset-token"
              type="text"
              required
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
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
        )}

        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="new-password"
            style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}
          >
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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
          <label
            htmlFor="confirm-new-password"
            style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}
          >
            Confirm New Password
          </label>
          <input
            id="confirm-new-password"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "0.625rem",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            fontWeight: 500,
            borderRadius: "6px",
            border: "none",
            fontSize: "0.875rem",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? "Updating password..." : "Update Password"}
        </button>
      </form>
    </div>
  );
};
