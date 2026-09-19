import { describe, expect, it } from "vitest";
import { OAuthService } from "../server/oauth-service.js";
import { InMemoryAuthRepository } from "../server/repository.js";

describe("OAuth Flow & Security", () => {
  function setup() {
    const repo = new InMemoryAuthRepository();
    const allowedRedirects = ["https://app.example.com/api/auth/callback/google"];
    const oauthService = new OAuthService(repo, allowedRedirects);
    return { repo, oauthService };
  }

  it("generates PKCE code challenge, verifier, and cryptographically secure state", () => {
    const { oauthService } = setup();

    const { url, state } = oauthService.createAuthorizationUrl({
      provider: "google",
      redirectUri: "https://app.example.com/api/auth/callback/google",
      authorizeBaseUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      clientId: "test-client-id",
      scopes: ["openid", "email", "profile"],
    });

    expect(url).toContain("code_challenge=");
    expect(url).toContain("code_challenge_method=S256");
    expect(url).toContain(`state=${state}`);
    expect(state.length).toBeGreaterThanOrEqual(32);
  });

  it("rejects unauthorized redirect URIs not in the allowlist", () => {
    const { oauthService } = setup();

    expect(() =>
      oauthService.createAuthorizationUrl({
        provider: "google",
        redirectUri: "https://evil.com/callback",
        authorizeBaseUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        clientId: "test-client-id",
        scopes: ["openid"],
      })
    ).toThrow("Invalid or untrusted redirect URI");
  });

  it("validates state and prevents state replay", () => {
    const { oauthService } = setup();

    const { state } = oauthService.createAuthorizationUrl({
      provider: "google",
      redirectUri: "https://app.example.com/api/auth/callback/google",
      authorizeBaseUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      clientId: "test-client-id",
      scopes: ["openid"],
    });

    // First consumption succeeds
    const record = oauthService.validateAndConsumeState(state, "google");
    expect(record).toBeDefined();
    expect(record.codeVerifier).toBeDefined();

    // Second consumption must fail (replay prevention)
    expect(() => oauthService.validateAndConsumeState(state, "google")).toThrow(
      "Invalid or expired OAuth state"
    );
  });

  it("prevents account linking attack when OAuth provider email is unverified", async () => {
    const { repo, oauthService } = setup();

    // Existing user registered with verified email
    await repo.createUser({
      email: "victim@example.com",
      name: "Victim User",
      passwordHash: "hash123",
      role: "USER",
      accountStatus: "ACTIVE",
      isEmailVerified: true,
      mfaEnabled: false,
      mfaSecret: null,
      mfaLastUsedStep: 0,
      sessionVersion: 1,
      deletedAt: null,
      lockedUntil: null,
      failedLoginAttempts: 0,
    });

    const { state } = oauthService.createAuthorizationUrl({
      provider: "google",
      redirectUri: "https://app.example.com/api/auth/callback/google",
      authorizeBaseUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      clientId: "test-client-id",
      scopes: ["openid"],
    });

    const stateRecord = oauthService.validateAndConsumeState(state, "google");

    // Attacker tries to login via OAuth using victim's email but unverified
    await expect(
      oauthService.processOAuthCallback({
        profile: {
          provider: "google",
          providerUserId: "attacker-oauth-id",
          email: "victim@example.com",
          isEmailVerified: false, // NOT VERIFIED
        },
        stateRecord,
      })
    ).rejects.toThrow("The email address provided by OAuth is not verified");
  });

  it("prevents unlinking the final authentication provider to avoid user lockout", async () => {
    const { repo, oauthService } = setup();

    // User has NO password, only 1 linked OAuth account
    const user = await repo.createUser({
      email: "oauthonly@example.com",
      name: "OAuth Only User",
      passwordHash: null, // No password
      role: "USER",
      accountStatus: "ACTIVE",
      isEmailVerified: true,
      mfaEnabled: false,
      mfaSecret: null,
      mfaLastUsedStep: 0,
      sessionVersion: 1,
      deletedAt: null,
      lockedUntil: null,
      failedLoginAttempts: 0,
    });

    await repo.createOAuthAccount({
      userId: user.id,
      provider: "google",
      providerUserId: "google-12345",
      email: user.email,
    });

    // Unlinking Google must be rejected to prevent lockout
    await expect(oauthService.unlinkOAuthProvider(user.id, "google")).rejects.toThrow(
      "Cannot unlink the only authentication method"
    );
  });
});
