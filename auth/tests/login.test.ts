import { describe, expect, it } from "vitest";
import { AuthService } from "../server/auth-service.js";
import { InMemoryAuthRepository } from "../server/repository.js";
import { PasswordService } from "../server/password-service.js";

describe("Login Module", () => {
  async function setupTestEnvironment() {
    const repo = new InMemoryAuthRepository();
    const passwordService = new PasswordService();
    const authService = new AuthService(repo, {
      passwordService,
      config: { maxFailedLoginsBeforeLock: 3, lockoutDurationMs: 60000 },
    });

    // Seed active user
    const passwordHash = await passwordService.hashPassword("SuperSecret123!");
    const user = await repo.createUser({
      email: "testuser@example.com",
      name: "Test User",
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

    return { authService, repo, user, passwordService };
  }

  it("authenticates successfully with valid credentials and creates active session", async () => {
    const { authService } = await setupTestEnvironment();

    const result = await authService.login({
      email: "testuser@example.com",
      password: "SuperSecret123!",
    });

    expect(result.requiresMFA).toBe(false);
    if (!result.requiresMFA) {
      expect(result.user.email).toBe("testuser@example.com");
      expect(result.session).toBeDefined();
      expect(result.rawToken).toBeDefined();
      expect(result.session.isRevoked).toBe(false);
    }
  });

  it("fails login with incorrect password and increments failed attempts", async () => {
    const { authService, repo, user } = await setupTestEnvironment();

    await expect(
      authService.login({
        email: "testuser@example.com",
        password: "WrongPassword123!",
      })
    ).rejects.toThrow("Invalid email or password.");

    const updatedUser = await repo.findUserById(user.id);
    expect(updatedUser?.failedLoginAttempts).toBe(1);
  });

  it("locks account after reaching maximum failed attempts threshold", async () => {
    const { authService, repo, user } = await setupTestEnvironment();

    // 3 failed attempts (configured max)
    for (let i = 0; i < 3; i++) {
      await expect(
        authService.login({
          email: "testuser@example.com",
          password: "WrongPassword123!",
        })
      ).rejects.toThrow();
    }

    const lockedUser = await repo.findUserById(user.id);
    expect(lockedUser?.accountStatus).toBe("LOCKED");
    expect(lockedUser?.lockedUntil).not.toBeNull();

    // Subsequent attempt should fail with lockout message
    await expect(
      authService.login({
        email: "testuser@example.com",
        password: "SuperSecret123!",
      })
    ).rejects.toThrow("Account temporarily locked");
  });

  it("transparently rehashes password when security parameters upgrade", async () => {
    const repo = new InMemoryAuthRepository();
    // Start with lower cost parameters
    const lowCostPasswordService = new PasswordService({ cost: 16384, blockSize: 8, parallelization: 1 });
    const initialHash = await lowCostPasswordService.hashPassword("SuperSecret123!");

    const user = await repo.createUser({
      email: "upgrade@example.com",
      name: "Upgrade User",
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

    // Now service runs with upgraded standard cost (32768)
    const upgradedPasswordService = new PasswordService({ cost: 32768 });
    const authService = new AuthService(repo, { passwordService: upgradedPasswordService });

    await authService.login({
      email: "upgrade@example.com",
      password: "SuperSecret123!",
    });

    const updatedUser = await repo.findUserById(user.id);
    expect(updatedUser?.passwordHash).not.toBe(initialHash);
    expect(updatedUser?.passwordHash).toContain("N=32768");
  });

  it("returns requiresMFA: true when MFA is enabled on user account", async () => {
    const { authService, repo, user } = await setupTestEnvironment();

    // Enable MFA on user
    await repo.updateUser(user.id, {
      mfaEnabled: true,
      mfaSecret: "JBSWY3DPEHPK3PXP",
    });

    const result = await authService.login({
      email: "testuser@example.com",
      password: "SuperSecret123!",
    });

    expect(result.requiresMFA).toBe(true);
    if (result.requiresMFA) {
      expect(result.mfaSessionToken).toBeDefined();
    }
  });
});
