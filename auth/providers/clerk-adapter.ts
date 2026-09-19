import {
  LoginInput,
  OAuthProvider,
  PublicUser,
  SignupInput,
} from "../schemas/auth-schemas.js";
import { SessionRecord } from "../server/repository.js";
import {
  AuthProviderAdapter,
  AuthSessionResult,
} from "./provider-interface.js";

export interface ClerkConfig {
  publishableKey: string;
  secretKey: string;
}

export class ClerkAuthAdapter implements AuthProviderAdapter {
  readonly name = "clerk";
  private config: ClerkConfig;

  constructor(config: ClerkConfig) {
    this.config = config;
  }

  getPublishableKey(): string {
    return this.config.publishableKey;
  }

  async signUp(params: SignupInput): Promise<AuthSessionResult> {
    const now = new Date();
    const user: PublicUser = {
      id: crypto.randomUUID(),
      email: params.email,
      name: params.name || null,
      role: "USER",
      accountStatus: "PENDING_VERIFICATION",
      isEmailVerified: false,
      mfaEnabled: false,
      createdAt: now,
      updatedAt: now,
    };
    return { user };
  }

  async signInWithPassword(params: LoginInput): Promise<AuthSessionResult> {
    const now = new Date();
    const user: PublicUser = {
      id: crypto.randomUUID(),
      email: params.email,
      name: null,
      role: "USER",
      accountStatus: "ACTIVE",
      isEmailVerified: true,
      mfaEnabled: false,
      createdAt: now,
      updatedAt: now,
    };
    return { user, rawToken: "clerk-session-token" };
  }

  async signInWithMagicLink(email: string): Promise<{ message: string }> {
    return { message: `Clerk magic link sent to ${email}` };
  }

  async getOAuthAuthorizationUrl(
    provider: OAuthProvider,
    redirectUri: string
  ): Promise<{ url: string; state: string }> {
    const state = crypto.randomUUID();
    return {
      url: `https://clerk.accounts.dev/oauth/${provider}?redirect_url=${encodeURIComponent(redirectUri)}&state=${state}`,
      state,
    };
  }

  async handleOAuthCallback(
    _provider: OAuthProvider,
    code: string,
    _state: string
  ): Promise<AuthSessionResult> {
    const now = new Date();
    const user: PublicUser = {
      id: crypto.randomUUID(),
      email: `oauth-user-${code.slice(0, 8)}@example.com`,
      name: null,
      role: "USER",
      accountStatus: "ACTIVE",
      isEmailVerified: true,
      mfaEnabled: false,
      createdAt: now,
      updatedAt: now,
    };
    return { user, rawToken: "clerk-session-token" };
  }

  async signOut(_sessionId: string, _userId: string): Promise<void> {}

  async signOutAll(_userId: string): Promise<void> {}

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return { message: `Clerk password reset link sent to ${email}` };
  }

  async getUser(_userId: string): Promise<PublicUser | null> {
    return null;
  }

  async validateSessionToken(_token: string): Promise<{ session: SessionRecord; user: PublicUser } | null> {
    return null;
  }
}
