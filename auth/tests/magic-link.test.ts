import { describe, expect, it } from "vitest";
import { AuthService } from "../server/auth-service.js";
import { InMemoryAuthRepository } from "../server/repository.js";

describe("Magic Link Flow", () => {
  async function setup() {
    const repo = new InMemoryAuthRepository();
    const authService = new AuthService(repo);

    const user = await repo.createUser({
      email: "magic@example.com",
      name: "Magic User",
      passwordHash: null,
      role: "USER",
      accountStatus: "PENDING_VERIFICATION",
      isEmailVerified: false,
      mfaEnabled: false,
      mfaSecret: null,
      mfaLastUsedStep: 0,
      sessionVersion: 1,
      deletedAt: null,
      lockedUntil: null,
      failedLoginAttempts: 0,
    });

    return { repo, authService, user };
  }

  it("generates single-use magic link and authenticates user, auto-verifying email", async () => {
    const { authService, repo, user } = await setup();

    const { magicToken } = await authService.requestMagicLink("magic@example.com");
    expect(magicToken).toBeDefined();

    // Verify magic link
    const result = await authService.verifyMagicLink(magicToken!);
    expect(result.user.email).toBe("magic@example.com");
    expect(result.user.isEmailVerified).toBe(true);
    expect(result.user.accountStatus).toBe("ACTIVE");
    expect(result.session).toBeDefined();

    // Verify token was marked used and cannot be reused
    await expect(authService.verifyMagicLink(magicToken!)).rejects.toThrow(
      "Invalid or expired magic link"
    );

    const updatedUser = await repo.findUserById(user.id);
    expect(updatedUser?.isEmailVerified).toBe(true);
  });

  it("does not leak account existence when requesting magic link for unknown email", async () => {
    const { authService } = await setup();

    const res = await authService.requestMagicLink("unknown@example.com");
    expect(res.message).toBe("If an account with this email exists, a sign-in link has been sent.");
    expect(res.magicToken).toBeUndefined();
  });
});
