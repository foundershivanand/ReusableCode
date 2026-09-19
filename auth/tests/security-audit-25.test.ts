import { describe, expect, it } from "vitest";
import {
  PublicUserSchema,
  SignupSchema,
} from "../schemas/auth-schemas.js";
import { AuthService } from "../server/auth-service.js";
import { InMemoryAuthRepository } from "../server/repository.js";
import { PasswordService } from "../server/password-service.js";
import { SessionService } from "../server/session-service.js";
import { TokenService } from "../server/token-service.js";
import { MFAService } from "../server/mfa-service.js";
import { OAuthService } from "../server/oauth-service.js";
import { ServerPipeline } from "../server/pipeline.js";
import { AuditLogger } from "../server/audit-logger.js";
import {
  assertCanModifyUser,
  requireRole,
} from "../middleware/permission-middleware.js";

describe("Production-Readiness 25 Security Tests (Page 10 Requirements)", () => {
  async function setupSecuritySuite() {
    const repo = new InMemoryAuthRepository();
    const passwordService = new PasswordService();
    const sessionService = new SessionService(repo);
    const tokenService = new TokenService(repo, { passwordResetExpiryMs: 100 }); // 100ms for fast expiration test
    const mfaService = new MFAService();
    const auditLogger = new AuditLogger(repo);
    const oauthService = new OAuthService(repo, [
      "https://app.example.com/api/auth/callback/google",
    ]);

    const authService = new AuthService(repo, {
      passwordService,
      sessionService,
      tokenService,
      mfaService,
      auditLogger,
      config: { maxFailedLoginsBeforeLock: 3, preventAccountEnumeration: true },
    });

    const pipeline = new ServerPipeline(sessionService, auditLogger);

    const passwordHash = await passwordService.hashPassword("StandardPassword123!");
    const regularUser = await repo.createUser({
      email: "user@example.com",
      name: "Regular User",
      passwordHash,
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

    const adminUser = await repo.createUser({
      email: "admin@example.com",
      name: "Admin User",
      passwordHash,
      role: "ADMIN",
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

    return {
      repo,
      passwordService,
      sessionService,
      tokenService,
      mfaService,
      oauthService,
      authService,
      pipeline,
      regularUser,
      adminUser,
    };
  }

  // 1. Invalid email is rejected server-side
  it("1. Invalid email is rejected server-side", () => {
    const res = SignupSchema.safeParse({
      email: "invalid-email-address",
      password: "StrongPassword123!",
      passwordConfirm: "StrongPassword123!",
    });
    expect(res.success).toBe(false);
  });

  // 2. Invalid password is rejected server-side
  it("2. Invalid password is rejected server-side", () => {
    const res = SignupSchema.safeParse({
      email: "valid@example.com",
      password: "weak",
      passwordConfirm: "weak",
    });
    expect(res.success).toBe(false);
  });

  // 3. Missing fields are rejected
  it("3. Missing fields are rejected", () => {
    const res = SignupSchema.safeParse({
      email: "valid@example.com",
      // missing password & passwordConfirm
    });
    expect(res.success).toBe(false);
  });

  // 4. Unexpected/malicious input is rejected
  it("4. Unexpected/malicious input is rejected", () => {
    const res = SignupSchema.safeParse({
      email: "valid@example.com",
      password: "StrongPassword123!",
      passwordConfirm: "StrongPassword123!",
      role: "ADMIN", // Malicious unexpected field
      __proto__: { isAdmin: true },
    });
    expect(res.success).toBe(false); // Strict schema rejects extra fields
  });

  // 5. Oversized requests are rejected
  it("5. Oversized requests are rejected", async () => {
    const { pipeline } = await setupSecuritySuite();
    const oversizedBody = { payload: "A".repeat(5000) };

    const res = await pipeline.execute(
      { body: oversizedBody },
      {
        maxBodySizeBytes: 1024,
        handler: async () => ({ ok: true }),
      }
    );
    expect(res.status).toBe(413);
    expect(res.error?.code).toBe("PAYLOAD_TOO_LARGE");
  });

  // 6. Expired sessions are rejected
  it("6. Expired sessions are rejected", async () => {
    const { sessionService, regularUser } = await setupSecuritySuite();
    const { session, rawToken } = await sessionService.createSession(regularUser);

    // Expire session
    await sessionService["repo"].updateSession(session.id, {
      expiresAt: new Date(Date.now() - 10000),
    });

    const validated = await sessionService.validateSession(rawToken);
    expect(validated).toBeNull();
  });

  // 7. Revoked sessions are rejected
  it("7. Revoked sessions are rejected", async () => {
    const { sessionService, regularUser } = await setupSecuritySuite();
    const { session, rawToken } = await sessionService.createSession(regularUser);

    await sessionService.revokeSession(session.id);
    const validated = await sessionService.validateSession(rawToken);
    expect(validated).toBeNull();
  });

  // 8. Invalid JWTs / tokens are rejected
  it("8. Invalid JWTs/session tokens are rejected", async () => {
    const { sessionService } = await setupSecuritySuite();
    expect(await sessionService.validateSession("invalid-token-string")).toBeNull();
    expect(await sessionService.validateSession("")).toBeNull();
  });

  // 9. Modified JWT/token payloads are rejected
  it("9. Modified token payloads are rejected", async () => {
    const { sessionService, regularUser } = await setupSecuritySuite();
    const { rawToken } = await sessionService.createSession(regularUser);

    // Tamper with token string
    const tampered = rawToken.slice(0, -4) + "ffff";
    expect(await sessionService.validateSession(tampered)).toBeNull();
  });

  // 10. Invalid OAuth state is rejected
  it("10. Invalid OAuth state is rejected", async () => {
    const { oauthService } = await setupSecuritySuite();
    expect(() =>
      oauthService.validateAndConsumeState("forged-or-expired-state", "google")
    ).toThrow("Invalid or expired OAuth state");
  });

  // 11. Invalid OAuth redirect is rejected
  it("11. Invalid OAuth redirect is rejected", async () => {
    const { oauthService } = await setupSecuritySuite();
    expect(() =>
      oauthService.createAuthorizationUrl({
        provider: "google",
        redirectUri: "https://attacker-controlled-phishing.com/callback",
        authorizeBaseUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        clientId: "client-id",
        scopes: ["openid"],
      })
    ).toThrow("Invalid or untrusted redirect URI");
  });

  // 12. Expired password-reset tokens are rejected
  it("12. Expired password-reset tokens are rejected", async () => {
    const { authService } = await setupSecuritySuite();
    const { resetToken } = await authService.requestPasswordReset("user@example.com");

    // Wait for 150ms to exceed 100ms test expiry
    await new Promise((resolve) => setTimeout(resolve, 150));

    await expect(
      authService.resetPassword({
        token: resetToken!,
        newPassword: "NewValidPassword123!",
        confirmPassword: "NewValidPassword123!",
      })
    ).rejects.toThrow("Invalid or expired password reset token");
  });

  // 13. Reused password-reset tokens are rejected
  it("13. Reused password-reset tokens are rejected", async () => {
    const { authService } = await setupSecuritySuite();
    const { resetToken } = await authService.requestPasswordReset("user@example.com");

    // First use succeeds
    await authService.resetPassword({
      token: resetToken!,
      newPassword: "BrandNewPassword123!",
      confirmPassword: "BrandNewPassword123!",
    });

    // Reusing the same single-use token MUST fail
    await expect(
      authService.resetPassword({
        token: resetToken!,
        newPassword: "AnotherNewPassword123!",
        confirmPassword: "AnotherNewPassword123!",
      })
    ).rejects.toThrow("Invalid or expired password reset token");
  });

  // 14. Invalid MFA codes are rejected
  it("14. Invalid MFA codes are rejected", () => {
    const mfaService = new MFAService();
    const setup = mfaService.generateSetup("user@example.com");
    const result = mfaService.verifyTOTP(setup.secret, "000000");
    expect(result.valid).toBe(false);
  });

  // 15. Excessive login attempts are rate limited
  it("15. Excessive login attempts are rate limited", async () => {
    const { authService } = await setupSecuritySuite();

    for (let i = 0; i < 3; i++) {
      await expect(
        authService.login({ email: "user@example.com", password: "WrongPassword!" })
      ).rejects.toThrow();
    }

    // 4th attempt is rate-limited / locked
    await expect(
      authService.login({ email: "user@example.com", password: "StandardPassword123!" })
    ).rejects.toThrow(/Account temporarily locked|Too many login attempts/);
  });

  // 16. Unauthorized users cannot access protected routes
  it("16. Unauthorized users cannot access protected routes", async () => {
    const { pipeline } = await setupSecuritySuite();

    const res = await pipeline.execute(
      { headers: {} },
      {
        requireAuth: true,
        handler: async () => ({ secretData: "confidential" }),
      }
    );
    expect(res.status).toBe(401);
  });

  // 17. Users cannot modify another user's account
  it("17. Users cannot modify another user's account", async () => {
    const { regularUser } = await setupSecuritySuite();

    expect(() =>
      assertCanModifyUser(regularUser, "another-user-id", { name: "Compromised" })
    ).toThrow("Cannot modify another user's account");
  });

  // 18. Users cannot modify their own role/permissions
  it("18. Users cannot modify their own role/permissions", async () => {
    const { regularUser } = await setupSecuritySuite();

    expect(() =>
      assertCanModifyUser(regularUser, regularUser.id, { role: "ADMIN" })
    ).toThrow("Ordinary users cannot modify roles or permissions");
  });

  // 19. Admin endpoints reject ordinary users
  it("19. Admin endpoints reject ordinary users", async () => {
    const { regularUser } = await setupSecuritySuite();

    expect(() => requireRole(regularUser, "ADMIN")).toThrow(
      "Forbidden: Insufficient role"
    );
  });

  // 20. Sensitive authentication data never appears in API responses
  it("20. Sensitive authentication data never appears in API responses", async () => {
    const { authService, regularUser } = await setupSecuritySuite();

    const sanitized = authService.sanitizeUser(regularUser);
    const parsed = PublicUserSchema.parse(sanitized);

    expect((parsed as any).passwordHash).toBeUndefined();
    expect((parsed as any).mfaSecret).toBeUndefined();
    expect((parsed as any).tokenHash).toBeUndefined();
  });

  // 21. Authentication failures do not leak whether an account exists
  it("21. Authentication failures do not leak whether an account exists", async () => {
    const { authService } = await setupSecuritySuite();

    let existingUserError = "";
    try {
      await authService.login({ email: "user@example.com", password: "WrongPassword!" });
    } catch (err: any) {
      existingUserError = err.message;
    }

    let nonexistentUserError = "";
    try {
      await authService.login({ email: "ghost@example.com", password: "WrongPassword!" });
    } catch (err: any) {
      nonexistentUserError = err.message;
    }

    expect(existingUserError).toBe("Invalid email or password.");
    expect(nonexistentUserError).toBe("Invalid email or password.");
    expect(existingUserError).toBe(nonexistentUserError);
  });

  // 22. Session invalidation actually prevents further access
  it("22. Session invalidation actually prevents further access", async () => {
    const { sessionService, pipeline, regularUser } = await setupSecuritySuite();
    const { session, rawToken } = await sessionService.createSession(regularUser);

    // Initial access works
    const res1 = await pipeline.execute(
      { headers: { authorization: `Bearer ${rawToken}` } },
      { requireAuth: true, handler: async () => ({ ok: true }) }
    );
    expect(res1.status).toBe(200);

    // Invalidate session
    await sessionService.revokeSession(session.id);

    // Subsequent access fails
    const res2 = await pipeline.execute(
      { headers: { authorization: `Bearer ${rawToken}` } },
      { requireAuth: true, handler: async () => ({ ok: true }) }
    );
    expect(res2.status).toBe(401);
  });

  // 23. Logout invalidates the appropriate session
  it("23. Logout invalidates the appropriate session", async () => {
    const { authService, sessionService, regularUser } = await setupSecuritySuite();
    const { session, rawToken } = await sessionService.createSession(regularUser);

    await authService.logout(session.id, regularUser.id);
    expect(await sessionService.validateSession(rawToken)).toBeNull();
  });

  // 24. Logout-all-devices invalidates all applicable sessions
  it("24. Logout-all-devices invalidates all applicable sessions", async () => {
    const { authService, sessionService, regularUser } = await setupSecuritySuite();
    const s1 = await sessionService.createSession(regularUser);
    const s2 = await sessionService.createSession(regularUser);

    await authService.logoutAllDevices(regularUser.id);

    expect(await sessionService.validateSession(s1.rawToken)).toBeNull();
    expect(await sessionService.validateSession(s2.rawToken)).toBeNull();
  });

  // 25. Password reset invalidates appropriate existing sessions
  it("25. Password reset invalidates appropriate existing sessions", async () => {
    const { authService, sessionService, regularUser } = await setupSecuritySuite();
    const s1 = await sessionService.createSession(regularUser);
    const s2 = await sessionService.createSession(regularUser);

    const { resetToken } = await authService.requestPasswordReset(regularUser.email);

    await authService.resetPassword({
      token: resetToken!,
      newPassword: "BrandNewPassword123!",
      confirmPassword: "BrandNewPassword123!",
    });

    // All existing sessions must be invalidated
    expect(await sessionService.validateSession(s1.rawToken)).toBeNull();
    expect(await sessionService.validateSession(s2.rawToken)).toBeNull();
  });
});
