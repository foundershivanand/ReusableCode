import { describe, expect, it } from "vitest";
import { AuthService } from "../server/auth-service.js";
import { InMemoryAuthRepository } from "../server/repository.js";
import { PasswordService } from "../server/password-service.js";
import { SessionService } from "../server/session-service.js";

describe("Password Reset & Security", () => {
  async function setup() {
    const repo = new InMemoryAuthRepository();
    const passwordService = new PasswordService();
    const sessionService = new SessionService(repo);
    const authService = new AuthService(repo, { passwordService, sessionService });

    const initialHash = await passwordService.hashPassword("InitialPassword123!");
    const user = await repo.createUser({
      email: "reset@example.com",
      name: "Reset User",
      passwordHash: initialHash,
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
    await repo.addPasswordHistory(user.id, initialHash);

    const s1 = await sessionService.createSession(user);
    const s2 = await sessionService.createSession(user);

    return { repo, authService, sessionService, user, s1, s2, initialHash, passwordService };
  }

  it("does not reveal account existence when requesting password reset", async () => {
    const { authService } = await setup();

    const resKnown = await authService.requestPasswordReset("reset@example.com");
    const resUnknown = await authService.requestPasswordReset("nonexistent@example.com");

    expect(resKnown.message).toBe(resUnknown.message);
  });

  it("resets password, invalidates all existing sessions, and prevents token reuse", async () => {
    const { authService, sessionService, s1, s2 } = await setup();

    const { resetToken } = await authService.requestPasswordReset("reset@example.com");
    expect(resetToken).toBeDefined();

    // Execute reset
    await authService.resetPassword({
      token: resetToken!,
      newPassword: "BrandNewPassword123!",
      confirmPassword: "BrandNewPassword123!",
    });

    // Both previous sessions must be revoked!
    expect(await sessionService.validateSession(s1.rawToken)).toBeNull();
    expect(await sessionService.validateSession(s2.rawToken)).toBeNull();

    // Reusing the same reset token must be rejected!
    await expect(
      authService.resetPassword({
        token: resetToken!,
        newPassword: "AnotherPassword123!",
        confirmPassword: "AnotherPassword123!",
      })
    ).rejects.toThrow("Invalid or expired password reset token");

    // Login with new password should succeed
    const loginRes = await authService.login({
      email: "reset@example.com",
      password: "BrandNewPassword123!",
    });
    expect(loginRes.requiresMFA).toBe(false);
  });

  it("prevents reuse of recently used passwords", async () => {
    const { authService, user } = await setup();

    const { resetToken } = await authService.requestPasswordReset(user.email);

    await expect(
      authService.resetPassword({
        token: resetToken!,
        newPassword: "InitialPassword123!", // Old password
        confirmPassword: "InitialPassword123!",
      })
    ).rejects.toThrow("You cannot reuse a recently used password.");
  });
});
