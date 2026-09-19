import { describe, expect, it } from "vitest";
import { SessionService } from "../server/session-service.js";
import { InMemoryAuthRepository } from "../server/repository.js";

describe("Session Lifecycle & Security", () => {
  async function setup() {
    const repo = new InMemoryAuthRepository();
    const sessionService = new SessionService(repo, {
      inactivityTimeoutMs: 1000, // 1 second for fast test
      absoluteLifetimeMs: 5000, // 5 seconds
      slidingExpiration: true,
    });

    const user = await repo.createUser({
      email: "session@example.com",
      name: "Session User",
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

    return { repo, sessionService, user };
  }

  it("rotates session identifier after authentication to prevent session fixation", async () => {
    const { sessionService, user } = await setup();

    const { session: originalSession, rawToken: originalToken } =
      await sessionService.createSession(user);

    // Rotate session
    const { session: rotatedSession, rawToken: rotatedToken } =
      await sessionService.rotateSession(originalSession.id);

    expect(rotatedSession.id).not.toBe(originalSession.id);
    expect(rotatedToken).not.toBe(originalToken);

    // Old token should be revoked and invalid
    expect(await sessionService.validateSession(originalToken)).toBeNull();

    // Rotated token should be valid
    const validated = await sessionService.validateSession(rotatedToken);
    expect(validated).not.toBeNull();
    expect(validated?.session.id).toBe(rotatedSession.id);
  });

  it("rejects session after inactivity timeout has elapsed", async () => {
    const { sessionService, user } = await setup();

    const { rawToken, session } = await sessionService.createSession(user);

    // Validate immediately (active)
    expect(await sessionService.validateSession(rawToken)).not.toBeNull();

    // Fast-forward inactivity by manipulating lastActiveAt
    await sessionService["repo"].updateSession(session.id, {
      lastActiveAt: new Date(Date.now() - 2000), // 2 seconds ago (> 1s timeout)
    });

    // Session should now be rejected and marked revoked
    expect(await sessionService.validateSession(rawToken)).toBeNull();
  });

  it("globally invalidates sessions when user.sessionVersion increments", async () => {
    const { sessionService, repo, user } = await setup();

    const { rawToken } = await sessionService.createSession(user);
    expect(await sessionService.validateSession(rawToken)).not.toBeNull();

    // Bump sessionVersion on user record
    await repo.updateUser(user.id, { sessionVersion: user.sessionVersion + 1 });

    // Session should be rejected due to version mismatch
    expect(await sessionService.validateSession(rawToken)).toBeNull();
  });
});
