import {
  LoginInput,
  OAuthProvider,
  PublicUser,
  SignupInput,
} from "../schemas/auth-schemas.js";
import { AuthService } from "../server/auth-service.js";
import { OAuthService } from "../server/oauth-service.js";
import { SessionRecord } from "../server/repository.js";
import {
  AuthProviderAdapter,
  AuthSessionResult,
} from "./provider-interface.js";

export class CustomAuthProvider implements AuthProviderAdapter {
  readonly name = "custom";
  private authService: AuthService;
  private oauthService?: OAuthService;

  constructor(authService: AuthService, oauthService?: OAuthService) {
    this.authService = authService;
    this.oauthService = oauthService;
  }

  async signUp(
    params: SignupInput,
    metadata?: { ip?: string; userAgent?: string }
  ): Promise<AuthSessionResult> {
    const { user } = await this.authService.signup(params, metadata);
    return { user };
  }

  async signInWithPassword(
    params: LoginInput,
    metadata?: { ip?: string; userAgent?: string }
  ): Promise<AuthSessionResult> {
    const result = await this.authService.login(params, metadata);
    if (result.requiresMFA) {
      return {
        user: null as any,
        requiresMFA: true,
        mfaSessionToken: result.mfaSessionToken,
      };
    }

    return {
      user: result.user,
      session: result.session,
      rawToken: result.rawToken,
      requiresMFA: false,
    };
  }

  async signInWithMagicLink(
    email: string,
    metadata?: { ip?: string; userAgent?: string }
  ): Promise<{ message: string }> {
    return this.authService.requestMagicLink(email, metadata);
  }

  async getOAuthAuthorizationUrl(
    provider: OAuthProvider,
    redirectUri: string
  ): Promise<{ url: string; state: string }> {
    if (!this.oauthService) {
      throw new Error("OAuth service not configured in CustomAuthProvider");
    }

    const providerConfigs: Record<OAuthProvider, { url: string; clientId: string; scopes: string[] }> = {
      google: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        clientId: process.env.GOOGLE_CLIENT_ID || "mock-google-client-id",
        scopes: ["openid", "email", "profile"],
      },
      github: {
        url: "https://github.com/login/oauth/authorize",
        clientId: process.env.GITHUB_CLIENT_ID || "mock-github-client-id",
        scopes: ["user:email", "read:user"],
      },
      apple: {
        url: "https://appleid.apple.com/auth/authorize",
        clientId: process.env.APPLE_CLIENT_ID || "mock-apple-client-id",
        scopes: ["name", "email"],
      },
    };

    const cfg = providerConfigs[provider];
    return this.oauthService.createAuthorizationUrl({
      provider,
      redirectUri,
      authorizeBaseUrl: cfg.url,
      clientId: cfg.clientId,
      scopes: cfg.scopes,
    });
  }

  async handleOAuthCallback(
    provider: OAuthProvider,
    code: string,
    state: string
  ): Promise<AuthSessionResult> {
    if (!this.oauthService) {
      throw new Error("OAuth service not configured in CustomAuthProvider");
    }

    const stateRecord = this.oauthService.validateAndConsumeState(state, provider);

    // In a real OAuth handshake, code is exchanged for tokens at the provider's token endpoint
    // We sanitize and process the profile
    const profile = this.oauthService.sanitizeProfile({
      provider,
      providerUserId: `oauth-user-${code.slice(0, 8)}`,
      email: `user-${code.slice(0, 8)}@example.com`,
      isEmailVerified: true,
      name: `OAuth User ${provider}`,
    });

    const { user } = await this.oauthService.processOAuthCallback({
      profile,
      stateRecord,
    });

    const sessionResult = await this.authService
      .getSessionService()
      .createSession(user);

    return {
      user: this.authService.sanitizeUser(user),
      session: sessionResult.session,
      rawToken: sessionResult.rawToken,
    };
  }

  async signOut(sessionId: string, userId: string): Promise<void> {
    await this.authService.logout(sessionId, userId);
  }

  async signOutAll(userId: string): Promise<void> {
    await this.authService.logoutAllDevices(userId);
  }

  async requestPasswordReset(
    email: string,
    metadata?: { ip?: string; userAgent?: string }
  ): Promise<{ message: string }> {
    return this.authService.requestPasswordReset(email, metadata);
  }

  async getUser(userId: string): Promise<PublicUser | null> {
    const user = await this.authService.getRepository().findUserById(userId);
    return user ? this.authService.sanitizeUser(user) : null;
  }

  async validateSessionToken(
    token: string
  ): Promise<{ session: SessionRecord; user: PublicUser } | null> {
    const result = await this.authService.getSessionService().validateSession(token);
    if (!result) return null;
    return {
      session: result.session,
      user: this.authService.sanitizeUser(result.user),
    };
  }
}
