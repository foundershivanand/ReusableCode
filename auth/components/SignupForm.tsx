import React, { useState } from "react";
import { SignupInput, SignupSchema } from "../schemas/auth-schemas.js";
import { OAuthButtons } from "./OAuthButtons.js";
import { OAuthProvider } from "../schemas/auth-schemas.js";

export interface SignupFormProps {
  onSubmit: (data: SignupInput) => Promise<void>;
  onOAuth?: (provider: OAuthProvider) => void;
  onLoginClick?: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSubmit,
  onOAuth,
  onLoginClick,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = SignupSchema.safeParse({
      email,
      password,
      passwordConfirm,
      name: name || undefined,
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
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div
        role="region"
        aria-label="Signup Success"
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
          Account Created!
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#4b5563", marginBottom: "1.5rem" }}>
          We have sent a confirmation link to <strong>{email}</strong>. Please check your email to activate your account.
        </p>
        {onLoginClick && (
          <button
            type="button"
            onClick={onLoginClick}
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
            Back to Sign In
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Signup Form"
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
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Create your account</h2>

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
            htmlFor="signup-name"
            style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}
          >
            Full Name (optional)
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
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

        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="signup-email"
            style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}
          >
            Email Address
          </label>
          <input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="signup-password"
            style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}
          >
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          <span style={{ display: "block", fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
            Must be at least 10 characters with upper, lower, numbers, and symbols.
          </span>
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label
            htmlFor="signup-confirm"
            style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}
          >
            Confirm Password
          </label>
          <input
            id="signup-confirm"
            type="password"
            required
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
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
          {isLoading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      {onLoginClick && (
        <div style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.875rem", color: "#6b7280" }}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={onLoginClick}
            style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: 0 }}
          >
            Sign in
          </button>
        </div>
      )}
    </div>
  );
};
