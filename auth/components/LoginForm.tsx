import React, { useState } from "react";
import { LoginSchema } from "../schemas/auth-schemas.js";
import { OAuthButtons } from "./OAuthButtons.js";
import { OAuthProvider } from "../schemas/auth-schemas.js";

export interface LoginFormProps {
  onSubmit: (data: { email: string; password: string; rememberMe: boolean; mfaCode?: string }) => Promise<{ requiresMFA?: boolean }>;
  onOAuth?: (provider: OAuthProvider) => void;
  onForgotPassword?: () => void;
  onMagicLink?: () => void;
  onSignupClick?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onOAuth,
  onForgotPassword,
  onMagicLink,
  onSignupClick,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [showMfaInput, setShowMfaInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side schema check
    const validation = LoginSchema.safeParse({
      email,
      password,
      rememberMe,
      mfaCode: showMfaInput ? mfaCode : undefined,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Invalid input");
      return;
    }

    try {
      setIsLoading(true);
      const res = await onSubmit(validation.data);
      if (res.requiresMFA) {
        setShowMfaInput(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Login Form"
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
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Sign in to your account</h2>

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

      {onOAuth && (
        <>
          <OAuthButtons onSelectProvider={onOAuth} isLoading={isLoading} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "1.25rem 0",
              color: "#6b7280",
              fontSize: "0.75rem",
            }}
          >
            <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
            <span style={{ padding: "0 0.5rem" }}>OR</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="login-email"
            style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}
          >
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || showMfaInput}
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

        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label
              htmlFor="login-password"
              style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}
            >
              Password
            </label>
            {onForgotPassword && (
              <button
                type="button"
                onClick={onForgotPassword}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            )}
          </div>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading || showMfaInput}
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

        {showMfaInput && (
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="login-mfa"
              style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}
            >
              Two-Factor Authentication Code
            </label>
            <input
              id="login-mfa"
              type="text"
              required
              autoComplete="one-time-code"
              placeholder="6-digit code or recovery code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
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

        <div style={{ display: "flex", alignItems: "center", marginBottom: "1.25rem" }}>
          <input
            id="login-remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
            style={{ marginRight: "0.5rem" }}
          />
          <label htmlFor="login-remember" style={{ fontSize: "0.875rem", color: "#4b5563" }}>
            Remember me on this device
          </label>
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
          {isLoading ? "Signing in..." : showMfaInput ? "Verify & Sign In" : "Sign In"}
        </button>
      </form>

      <div style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.875rem", color: "#6b7280" }}>
        {onMagicLink && (
          <p style={{ margin: "0.25rem 0" }}>
            Prefer passwordless?{" "}
            <button
              type="button"
              onClick={onMagicLink}
              style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: 0 }}
            >
              Sign in with Magic Link
            </button>
          </p>
        )}
        {onSignupClick && (
          <p style={{ margin: "0.25rem 0" }}>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={onSignupClick}
              style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: 0 }}
            >
              Sign up
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
