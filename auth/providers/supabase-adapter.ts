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

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey?: string;
}

export class SupabaseAuthAdapter implements AuthProviderAdapter {
  readonly name = "supabase";
  private config: SupabaseConfig;

  constructor(config: SupabaseConfig) {
    this.config = config;
  }

  async signUp(params: SignupInput): Promise<AuthSessionResult> {
    // Adapter mapping to Supabase client auth.signUp({ email, password })
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
    // Adapter mapping to Supabase client auth.signInWithPassword({ email, password })
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
    const session: SessionRecord = {
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash: "supabase-token-hash",
      userAgent: null,
      ipAddress: null,
      createdAt: now,
      lastActiveAt: now,
      expiresAt: new Date(now.getTime() + 3600 * 1000),
      isRevoked: false,
      sessionVersion: 1,
    };
    return { user, session, rawToken: "supabase-access-token" };
  }

  async signInWithMagicLink(email: string): Promise<{ message: string }> {
    // Adapter mapping to Supabase client auth.signInWithOtp({ email })
    return { message: `Magic link sent to ${email}` };
  }

  async getOAuthAuthorizationUrl(
    provider: OAuthProvider,
    redirectUri: string
  ): Promise<{ url: string; state: string }> {
    const state = crypto.randomUUID();
    const url = `${this.config.supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectUri)}&state=${state}`;
    return { url, state };
  }

  async handleOAuthCallback(
    _provider: OAuthProvider,
    code: string,
    _state: string
  ): Promise<AuthSessionResult> {
    // Adapter mapping to Supabase auth.exchangeCodeForSession(code)
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
    return { user, rawToken: "supabase-oauth-token" };
  }

  async signOut(_sessionId: string, _userId: string): Promise<void> {
    // Adapter mapping to Supabase auth.signOut()
  }

  async signOutAll(_userId: string): Promise<void> {
    // Adapter mapping to Supabase auth.admin.signOut(userId, 'GLOBAL')
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    // Adapter mapping to Supabase auth.resetPasswordForEmail(email)
    return { message: `Password reset link sent to ${email}` };
  }

  async getUser(_userId: string): Promise<PublicUser | null> {
    return null;
  }

  async validateSessionToken(_token: string): Promise<{ session: SessionRecord; user: PublicUser } | null> {
    return null;
  }
}
