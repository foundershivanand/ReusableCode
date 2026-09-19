import crypto from "node:crypto";
import { OAuthProvider } from "../schemas/auth-schemas.js";
import { AuthRepository, OAuthAccountRecord, UserRecord } from "./repository.js";

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
}

export interface OAuthStateRecord {
  state: string;
  codeVerifier: string;
  nonce?: string;
  provider: OAuthProvider;
  redirectUri: string;
  linkingUserId?: string; // Set when linking an account to an existing authenticated user
  createdAt: number;
}

export interface OAuthUserProfile {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  isEmailVerified: boolean;
  name?: string;
  avatarUrl?: string;
}

export class OAuthService {
  private repo: AuthRepository;
  private allowedRedirectUris: Set<string>;
  private stateStore: Map<string, OAuthStateRecord> = new Map();
  private stateTtlMs: number = 10 * 60 * 1000; // 10 minutes

  constructor(repo: AuthRepository, allowedRedirectUris: string[]) {
    this.repo = repo;
    this.allowedRedirectUris = new Set(allowedRedirectUris);
  }

  /**
   * Generates PKCE code_verifier and code_challenge (S256)
   */
  generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");
    return { codeVerifier, codeChallenge };
  }

  /**
   * Initiates OAuth flow with PKCE, state, and nonce
   */
  createAuthorizationUrl(params: {
    provider: OAuthProvider;
    redirectUri: string;
    authorizeBaseUrl: string;
    clientId: string;
    scopes: string[];
    linkingUserId?: string;
  }): { url: string; state: string } {
    // 1. Validate redirect URI against exact allowlist
    if (!this.allowedRedirectUris.has(params.redirectUri)) {
      throw new Error("Invalid or untrusted redirect URI");
    }

    const state = crypto.randomBytes(24).toString("hex");
    const nonce = crypto.randomBytes(16).toString("hex");
    const { codeVerifier, codeChallenge } = this.generatePKCE();

    // Store state in memory (or redis)
    this.stateStore.set(state, {
      state,
      codeVerifier,
      nonce,
      provider: params.provider,
      redirectUri: params.redirectUri,
      linkingUserId: params.linkingUserId,
      createdAt: Date.now(),
    });

    const query = new URLSearchParams({
      response_type: "code",
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
      scope: params.scopes.join(" "),
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return {
      url: `${params.authorizeBaseUrl}?${query.toString()}`,
      state,
    };
  }

  /**
   * Validates state and consumes it (prevents replay)
   */
  validateAndConsumeState(state: string, provider: OAuthProvider): OAuthStateRecord {
    const record = this.stateStore.get(state);
    if (!record) {
      throw new Error("Invalid or expired OAuth state");
    }

    this.stateStore.delete(state);

    if (Date.now() - record.createdAt > this.stateTtlMs) {
      throw new Error("OAuth state expired");
    }

    if (record.provider !== provider) {
      throw new Error("OAuth provider mismatch for state");
    }

    return record;
  }

  /**
   * Sanitizes untrusted profile fields from OAuth providers
   */
  sanitizeProfile(rawProfile: Partial<OAuthUserProfile>): OAuthUserProfile {
    if (!rawProfile.provider || !rawProfile.providerUserId || !rawProfile.email) {
      throw new Error("Malformed OAuth user profile");
    }

    const email = rawProfile.email.trim().toLowerCase();
    const name = rawProfile.name ? rawProfile.name.trim().slice(0, 100) : undefined;
    let avatarUrl: string | undefined;

    if (rawProfile.avatarUrl) {
      try {
        const parsed = new URL(rawProfile.avatarUrl);
        if (parsed.protocol === "https:") {
          avatarUrl = rawProfile.avatarUrl.slice(0, 1024);
        }
      } catch {
        // Ignore invalid URL
      }
    }

    return {
      provider: rawProfile.provider,
      providerUserId: String(rawProfile.providerUserId).trim(),
      email,
      isEmailVerified: Boolean(rawProfile.isEmailVerified),
      name,
      avatarUrl,
    };
  }

  /**
   * Handles OAuth login / account linking with defense against account takeover:
   * - If linkingUserId is provided (authenticated user linking an account), links directly.
   * - If not provided:
   *   - If OAuth account already linked -> sign in as that user.
   *   - If existing user has same email:
   *     - If provider email is UNVERIFIED -> REJECT (prevents malicious takeover).
   *     - If provider email IS verified -> link if allowed by policy or return collision.
   *   - If no user exists -> create new user and link OAuth account.
   */
  async processOAuthCallback(params: {
    profile: OAuthUserProfile;
    stateRecord: OAuthStateRecord;
  }): Promise<{ user: UserRecord; oauthAccount: OAuthAccountRecord; isNewUser: boolean }> {
    const profile = this.sanitizeProfile(params.profile);
    const { linkingUserId } = params.stateRecord;

    // Case 1: Authenticated user explicitly linking account
    if (linkingUserId) {
      const existingUser = await this.repo.findUserById(linkingUserId);
      if (!existingUser) {
        throw new Error("User to link does not exist");
      }

      // Check if OAuth account is already linked to another user
      const existingOAuth = await this.repo.findOAuthAccount(profile.provider, profile.providerUserId);
      if (existingOAuth) {
        if (existingOAuth.userId !== linkingUserId) {
          throw new Error("This OAuth account is already linked to a different user");
        }
        return { user: existingUser, oauthAccount: existingOAuth, isNewUser: false };
      }

      const newOAuth = await this.repo.createOAuthAccount({
        userId: existingUser.id,
        provider: profile.provider,
        providerUserId: profile.providerUserId,
        email: profile.email,
      });

      return { user: existingUser, oauthAccount: newOAuth, isNewUser: false };
    }

    // Case 2: Sign-in / Sign-up flow
    // Check if OAuth account already exists
    const existingOAuth = await this.repo.findOAuthAccount(profile.provider, profile.providerUserId);
    if (existingOAuth) {
      const user = await this.repo.findUserById(existingOAuth.userId);
      if (!user) {
        throw new Error("Linked user account not found");
      }
      return { user, oauthAccount: existingOAuth, isNewUser: false };
    }

    // Check if a user with this email already exists
    const userByEmail = await this.repo.findUserByEmail(profile.email);
    if (userByEmail) {
      // Account linking attack prevention:
      // If provider did not verify the email, do NOT auto-link to existing account!
      if (!profile.isEmailVerified) {
        throw new Error(
          "Cannot link account: The email address provided by OAuth is not verified by the provider"
        );
      }

      // Link OAuth account to existing user
      const oauthAccount = await this.repo.createOAuthAccount({
        userId: userByEmail.id,
        provider: profile.provider,
        providerUserId: profile.providerUserId,
        email: profile.email,
      });

      return { user: userByEmail, oauthAccount, isNewUser: false };
    }

    // Create brand new user
    const newUser = await this.repo.createUser({
      email: profile.email,
      name: profile.name || null,
      passwordHash: null,
      role: "USER",
      accountStatus: "ACTIVE",
      isEmailVerified: profile.isEmailVerified,
      mfaEnabled: false,
      mfaSecret: null,
      mfaLastUsedStep: 0,
      sessionVersion: 1,
      deletedAt: null,
      lockedUntil: null,
      failedLoginAttempts: 0,
    });

    const oauthAccount = await this.repo.createOAuthAccount({
      userId: newUser.id,
      provider: profile.provider,
      providerUserId: profile.providerUserId,
      email: profile.email,
    });

    return { user: newUser, oauthAccount, isNewUser: true };
  }

  /**
   * Unlinks an OAuth provider from a user account.
   * Enforces: unlinking the final authentication provider must not lock the user out!
   */
  async unlinkOAuthProvider(userId: string, provider: OAuthProvider): Promise<void> {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const linkedAccounts = await this.repo.findOAuthAccountsByUserId(userId);
    const hasPassword = Boolean(user.passwordHash);

    // If user has no password and only this 1 OAuth account, disallow unlinking!
    if (!hasPassword && linkedAccounts.length <= 1) {
      throw new Error(
        "Cannot unlink the only authentication method. Please set a password first to avoid lockout."
      );
    }

    await this.repo.deleteOAuthAccount(userId, provider);
  }
}
