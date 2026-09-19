import { describe, expect, it } from "vitest";
import { MFAService } from "../server/mfa-service.js";
import { AuthService } from "../server/auth-service.js";
import { InMemoryAuthRepository } from "../server/repository.js";
import { PasswordService } from "../server/password-service.js";
import { SessionService } from "../server/session-service.js";

describe("MFA / 2FA Engine", () => {
  it("verifies TOTP code within valid window and handles clock drift (±1 step)", () => {
    const mfaService = new MFAService();
    const setup = mfaService.generateSetup("mfa@example.com");

    const now = Date.now();
    const currentCode = mfaService.generateTOTP(setup.secret, now);

    // 1. Current step valid
    const currentVerify = mfaService.verifyTOTP(setup.secret, currentCode, 0, now);
    expect(currentVerify.valid).toBe(true);

    // 2. Drift -1 step (30s in the past)
    const pastTime = now - 30000;
    const pastCode = mfaService.generateTOTP(setup.secret, pastTime);
    const pastVerify = mfaService.verifyTOTP(setup.secret, pastCode, 0, now);
    expect(pastVerify.valid).toBe(true);

    // 3. Drift +1 step (30s in future)
    const futureTime = now + 30000;
    const futureCode = mfaService.generateTOTP(setup.secret, futureTime);
    const futureVerify = mfaService.verifyTOTP(setup.secret, futureCode, 0, now);
    expect(futureVerify.valid).toBe(true);

    // 4. Beyond window (> 60s) fails
    const tooOldTime = now - 90000;
    const tooOldCode = mfaService.generateTOTP(setup.secret, tooOldTime);
    const tooOldVerify = mfaService.verifyTOTP(setup.secret, tooOldCode, 0, now);
    expect(tooOldVerify.valid).toBe(false);
  });

  it("prevents TOTP code replay attacks", () => {
    const mfaService = new MFAService();
    const setup = mfaService.generateSetup("replay@example.com");
    const now = Date.now();
    const code = mfaService.generateTOTP(setup.secret, now);

    // First use succeeds
    const firstAttempt = mfaService.verifyTOTP(setup.secret, code, 0, now);
    expect(firstAttempt.valid).toBe(true);
    const usedStep = firstAttempt.step!;

    // Second use of the exact same step is REJECTED
    const replayAttempt = mfaService.verifyTOTP(setup.secret, code, usedStep, now);
    expect(replayAttempt.valid).toBe(false);
  });

  it("hashes recovery codes and allows only one-time use per code", async () => {
    const repo = new InMemoryAuthRepository();
    const passwordService = new PasswordService();
    const sessionService = new SessionService(repo);
    const mfaService = new MFAService();
    const authService = new AuthService(repo, { passwordService, sessionService, mfaService });

    const passwordHash = await passwordService.hashPassword("Password123!");
    const user = await repo.createUser({
      email: "recovery@example.com",
      name: "Recovery User",
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

    const s1 = await sessionService.createSession(user);

    // Setup MFA
    const setup = authService.setupMFA(user);
    const code = mfaService.generateTOTP(setup.secret);

    // Confirm & enable with the generated recovery codes
    await authService.confirmAndEnableMFA(user.id, setup.secret, code, s1.session.id, setup.recoveryCodes);

    // Stored recovery codes should be hashed
    const activeCodes = await repo.findActiveRecoveryCodes(user.id);
    expect(activeCodes.length).toBe(10);
    expect(activeCodes[0].codeHash).not.toBe(setup.recoveryCodes[0]);

    // Use recovery code on login
    const loginResult = await authService.login({
      email: "recovery@example.com",
      password: "Password123!",
      mfaCode: setup.recoveryCodes[0],
    });

    expect(loginResult.requiresMFA).toBe(false);

    // That recovery code is now consumed (9 active left)
    const remainingCodes = await repo.findActiveRecoveryCodes(user.id);
    expect(remainingCodes.length).toBe(9);

    // Reusing the same recovery code must fail
    await expect(
      authService.login({
        email: "recovery@example.com",
        password: "Password123!",
        mfaCode: setup.recoveryCodes[0],
      })
    ).rejects.toThrow();
  });

  it("requires current password to disable MFA and revokes other sessions", async () => {
    const repo = new InMemoryAuthRepository();
    const passwordService = new PasswordService();
    const sessionService = new SessionService(repo);
    const authService = new AuthService(repo, { passwordService, sessionService });

    const passwordHash = await passwordService.hashPassword("Password123!");
    const user = await repo.createUser({
      email: "disablemfa@example.com",
      name: "Disable MFA User",
      passwordHash,
      role: "USER",
      accountStatus: "ACTIVE",
      isEmailVerified: true,
      mfaEnabled: true,
      mfaSecret: "JBSWY3DPEHPK3PXP",
      mfaLastUsedStep: 0,
      sessionVersion: 1,
      deletedAt: null,
      lockedUntil: null,
      failedLoginAttempts: 0,
    });

    const s1 = await sessionService.createSession(user);
    const s2 = await sessionService.createSession(user);

    // Disabling with wrong password fails
    await expect(
      authService.disableMFA(user.id, "WrongPassword!", s1.session.id)
    ).rejects.toThrow("Authentication failed");

    // Disabling with correct password succeeds
    await authService.disableMFA(user.id, "Password123!", s1.session.id);

    const updated = await repo.findUserById(user.id);
    expect(updated?.mfaEnabled).toBe(false);

    // Other session s2 is revoked
    expect(await sessionService.validateSession(s2.rawToken)).toBeNull();
    // Current session s1 remains valid
    expect(await sessionService.validateSession(s1.rawToken)).not.toBeNull();
  });
});
