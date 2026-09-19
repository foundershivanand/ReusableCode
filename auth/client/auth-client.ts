import {
  AccountRecoveryInput,
  EmailChangeRequestInput,
  EmailChangeVerifyInput,
  LoginInput,
  MagicLinkInput,
  MFAChallengeInput,
  MFAVerifySetupInput,
  OAuthCallbackInput,
  PasswordChangeInput,
  PasswordResetInput,
  PasswordResetRequestInput,
  PublicUser,
  SignupInput,
  UserProfileUpdateInput,
} from "../schemas/auth-schemas.js";
import { ActiveSessionInfo } from "../server/session-service.js";

export interface ClientApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ClientLoginResponse {
  requiresMFA: boolean;
  mfaSessionToken?: string;
  user?: PublicUser;
}

export class AuthClient {
  private baseUrl: string;
  private csrfToken: string | null = null;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  setCsrfToken(token: string): void {
    this.csrfToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ClientApiResponse<T>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.csrfToken && ["POST", "PUT", "PATCH", "DELETE"].includes(options.method || "GET")) {
      headers["x-csrf-token"] = this.csrfToken;
    }

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: "include", // Enforces secure HttpOnly cookie transmission
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        return {
          success: false,
          error: json?.error || {
            code: `HTTP_${res.status}`,
            message: res.statusText || "Request failed",
          },
        };
      }

      return {
        success: true,
        data: json?.data ?? json,
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: err.message || "Network request failed",
        },
      };
    }
  }

  // Auth operations
  async signup(input: SignupInput) {
    return this.request<{ user: PublicUser; message: string }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async login(input: LoginInput) {
    return this.request<ClientLoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async completeMFAChallenge(input: MFAChallengeInput) {
    return this.request<{ user: PublicUser }>("/api/auth/mfa/challenge", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async logout() {
    return this.request<{ message: string }>("/api/auth/logout", {
      method: "POST",
    });
  }

  async logoutAll() {
    return this.request<{ message: string }>("/api/auth/logout-all", {
      method: "POST",
    });
  }

  async requestMagicLink(input: MagicLinkInput) {
    return this.request<{ message: string }>("/api/auth/magic-link", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async verifyMagicLink(token: string) {
    return this.request<{ user: PublicUser }>("/api/auth/magic-link/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async requestPasswordReset(input: PasswordResetRequestInput) {
    return this.request<{ message: string }>("/api/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async resetPassword(input: PasswordResetInput) {
    return this.request<{ message: string }>("/api/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async changePassword(input: PasswordChangeInput) {
    return this.request<{ message: string }>("/api/auth/password/change", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  // MFA operations
  async setupMFA() {
    return this.request<{ secret: string; otpauthUrl: string; recoveryCodes: string[] }>(
      "/api/auth/mfa/setup",
      { method: "POST" }
    );
  }

  async enableMFA(input: MFAVerifySetupInput) {
    return this.request<{ message: string }>("/api/auth/mfa/enable", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async disableMFA(currentPassword: string) {
    return this.request<{ message: string }>("/api/auth/mfa/disable", {
      method: "POST",
      body: JSON.stringify({ currentPassword }),
    });
  }

  async regenerateRecoveryCodes(currentPassword: string) {
    return this.request<{ recoveryCodes: string[] }>("/api/auth/mfa/recovery-codes/regenerate", {
      method: "POST",
      body: JSON.stringify({ currentPassword }),
    });
  }

  // Account operations
  async getProfile() {
    return this.request<{ user: PublicUser }>("/api/auth/me", {
      method: "GET",
    });
  }

  async updateProfile(input: UserProfileUpdateInput) {
    return this.request<{ user: PublicUser }>("/api/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  async requestEmailChange(input: EmailChangeRequestInput) {
    return this.request<{ message: string }>("/api/auth/email/change-request", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async verifyEmailChange(input: EmailChangeVerifyInput) {
    return this.request<{ user: PublicUser }>("/api/auth/email/verify-change", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async recoverAccount(input: AccountRecoveryInput) {
    return this.request<{ message: string }>("/api/auth/recovery", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  // Session management
  async getSessions() {
    return this.request<{ sessions: ActiveSessionInfo[] }>("/api/auth/sessions", {
      method: "GET",
    });
  }

  async revokeSession(sessionId: string) {
    return this.request<{ message: string }>(`/api/auth/sessions/${sessionId}`, {
      method: "DELETE",
    });
  }

  // OAuth callback
  async handleOAuthCallback(input: OAuthCallbackInput) {
    return this.request<{ user: PublicUser }>("/api/auth/oauth/callback", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
}
