import { describe, expect, it } from "vitest";
import { AuthService } from "../server/auth-service.js";
import { InMemoryAuthRepository } from "../server/repository.js";
import { InMemoryBreachChecker, PasswordService } from "../server/password-service.js";
import { SignupSchema } from "../schemas/auth-schemas.js";

describe("Signup Module", () => {
  function createTestAuthService() {
    const repo = new InMemoryAuthRepository();
    const breachChecker = new InMemoryBreachChecker(["BreachedPass123!"]);
    const passwordService = new PasswordService({}, breachChecker);
    const authService = new AuthService(repo, { passwordService });
    return { authService, repo, breachChecker };
  }

  it("successfully signs up a user with valid credentials and creates verification token", async () => {
    const { authService, repo } = createTestAuthService();

    const result = await authService.signup({
      email: "alice@example.com",
      password: "StrongPassword123!",
      passwordConfirm: "StrongPassword123!",
      name: "Alice",
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe("alice@example.com");
    expect(result.user.name).toBe("Alice");
    expect(result.user.accountStatus).toBe("PENDING_VERIFICATION");
    expect(result.user.isEmailVerified).toBe(false);
    expect(result.verificationToken).toBeDefined();

    // Verify stored user in database
    const dbUser = await repo.findUserById(result.user.id);
    expect(dbUser).toBeDefined();
    expect(dbUser?.passwordHash).not.toContain("StrongPassword123!");
    expect(dbUser?.passwordHash).toMatch(/^\$scrypt\$v=1/);
  });

  it("rejects signup when password does not meet complexity requirements", () => {
    // Too short
    const shortResult = SignupSchema.safeParse({
      email: "bob@example.com",
      password: "short",
      passwordConfirm: "short",
    });
    expect(shortResult.success).toBe(false);

    // Missing special character
    const noSpecial = SignupSchema.safeParse({
      email: "bob@example.com",
      password: "Password1234",
      passwordConfirm: "Password1234",
    });
    expect(noSpecial.success).toBe(false);

    // Repeating characters (4+)
    const repeating = SignupSchema.safeParse({
      email: "bob@example.com",
      password: "Paaaaassword123!",
      passwordConfirm: "Paaaaassword123!",
    });
    expect(repeating.success).toBe(false);
  });

  it("rejects signup when passwordConfirm does not match password", () => {
    const result = SignupSchema.safeParse({
      email: "bob@example.com",
      password: "StrongPassword123!",
      passwordConfirm: "DifferentPassword123!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Passwords do not match");
    }
  });

  it("rejects signup when password is in known breached database", async () => {
    const { authService } = createTestAuthService();

    await expect(
      authService.signup({
        email: "charlie@example.com",
        password: "BreachedPass123!",
        passwordConfirm: "BreachedPass123!",
      })
    ).rejects.toThrow("exposed in a data breach");
  });

  it("records password in password history on signup", async () => {
    const { authService, repo } = createTestAuthService();

    const { user } = await authService.signup({
      email: "history@example.com",
      password: "StrongPassword123!",
      passwordConfirm: "StrongPassword123!",
    });

    const history = await repo.getRecentPasswordHashes(user.id, 5);
    expect(history.length).toBe(1);
  });
});
