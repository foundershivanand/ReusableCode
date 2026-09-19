import { describe, expect, it } from "vitest";
import { AuthService } from "../server/auth-service.js";
import { InMemoryAuthRepository } from "../server/repository.js";
import { SessionService } from "../server/session-service.js";

describe("Logout & Revocation", () => {
  async function setup() {
    const repo = new InMemoryAuthRepository();
    const sessionService = new SessionService(repo);
    const authService = new AuthService(repo, { sessionService });

    const user = await repo.createUser({
      email: "logout@example.com",
      name: "Logout User",
      passwordHash: "dummy-hash",
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

    const s1 = await sessionService.createSession(user, { userAgent: "Browser 1" });
    const s2 = await sessionService.createSession(user, { userAgent: "Browser 2" });
    const s3 = await sessionService.createSession(user, { userAgent: "Mobile" });

    return { repo, sessionService, authService, user, s1, s2, s3 };
  }

  it("invalidates the appropriate session on standard logout", async () => {
    const { authService, sessionService, user, s1, s2 } = await setup();

    await authService.logout(s1.session.id, user.id);

    // s1 should now be rejected
    const val1 = await sessionService.validateSession(s1.rawToken);
    expect(val1).toBeNull();

    // s2 should still be valid
    const val2 = await sessionService.validateSession(s2.rawToken);
    expect(val2).not.toBeNull();
    expect(val2?.session.id).toBe(s2.session.id);
  });

  it("invalidates all sessions for user on logoutAllDevices (global session revocation)", async () => {
    const { authService, sessionService, user, s1, s2, s3 } = await setup();

    await authService.logoutAllDevices(user.id);

    // All sessions should be rejected
    expect(await sessionService.validateSession(s1.rawToken)).toBeNull();
    expect(await sessionService.validateSession(s2.rawToken)).toBeNull();
    expect(await sessionService.validateSession(s3.rawToken)).toBeNull();
  });

  it("invalidates other sessions while keeping current session intact", async () => {
    const { sessionService, user, s1, s2, s3 } = await setup();

    await sessionService.revokeAllOtherSessions(user.id, s1.session.id);

    // Current session (s1) stays active
    expect(await sessionService.validateSession(s1.rawToken)).not.toBeNull();

    // Other sessions (s2, s3) are revoked
    expect(await sessionService.validateSession(s2.rawToken)).toBeNull();
    expect(await sessionService.validateSession(s3.rawToken)).toBeNull();
  });
});
