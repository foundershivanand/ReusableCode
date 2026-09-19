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

export interface AuthJsConfig {
  secret: string;
  baseUrl: string;
}

export class AuthJsAdapter implements AuthProviderAdapter {
  readonly name = "authjs";
  private config: AuthJsConfig;

  constructor(config: AuthJsConfig) {
    this.config = config;
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
    return { user, rawToken: "authjs-session-token" };
  }

  async signInWithMagicLink(email: string): Promise<{ message: string }> {
    return { message: `Auth.js magic link sent to ${email}` };
  }

  async getOAuthAuthorizationUrl(
    provider: OAuthProvider,
    redirectUri: string
  ): Promise<{ url: string; state: string }> {
    const state = crypto.randomUUID();
    return {
      url: `${this.config.baseUrl}/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(redirectUri)}&state=${state}`,
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
    return { user, rawToken: "authjs-session-token" };
  }

  async signOut(_sessionId: string, _userId: string): Promise<void> {}

  async signOutAll(_userId: string): Promise<void> {}

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return { message: `Auth.js password reset link sent to ${email}` };
  }

  async getUser(_userId: string): Promise<PublicUser | null> {
    return null;
  }

  async validateSessionToken(_token: string): Promise<{ session: SessionRecord; user: PublicUser } | null> {
    return null;
  }
}
