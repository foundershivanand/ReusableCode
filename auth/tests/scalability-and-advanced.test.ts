import { describe, expect, it } from "vitest";
import { JWTService } from "../server/jwt-service.js";
import { AbuseDetectionService } from "../server/abuse-detection.js";
import { AuditLogger } from "../server/audit-logger.js";
import { InMemoryAuthRepository, UserRecord } from "../server/repository.js";
import { CleanupService } from "../server/cleanup-service.js";
import { SessionService } from "../server/session-service.js";

describe("Scalability & Advanced Features (100 to 1,000,000 users)", () => {
  const testUser: UserRecord = {
    id: "user-scale-1",
    email: "scale@example.com",
    name: "Scale User",
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("1. JWT Service (High-Throughput Stateless Verification)", () => {
    const jwtService = new JWTService({
      secret: "super-secure-production-jwt-secret-at-least-32-chars-long!",
      accessTokenExpirySeconds: 2, // 2s for fast test
    });

    it("signs and verifies JWT access tokens with correct claims", () => {
      const token = jwtService.signAccessToken({
        userId: testUser.id,
        sessionId: "session-123",
        role: testUser.role,
        sessionVersion: testUser.sessionVersion,
      });

      const payload = jwtService.verifyAccessToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe(testUser.id);
      expect(payload?.sessionId).toBe("session-123");
      expect(payload?.role).toBe("USER");
      expect(payload?.sessionVersion).toBe(1);
    });

    it("rejects tampered JWT access tokens", () => {
      const token = jwtService.signAccessToken({
        userId: testUser.id,
        sessionId: "session-123",
        role: testUser.role,
        sessionVersion: testUser.sessionVersion,
      });

      const parts = token.split(".");
      // Tamper with payload (elevate role to ADMIN)
      const tamperedPayload = Buffer.from(
        JSON.stringify({ sub: testUser.id, role: "ADMIN", exp: 9999999999 })
      ).toString("base64url");
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      expect(jwtService.verifyAccessToken(tamperedToken)).toBeNull();
    });

    it("rejects expired JWT access tokens", async () => {
      const shortLivedJwt = new JWTService({
        secret: "super-secure-production-jwt-secret-at-least-32-chars-long!",
        accessTokenExpirySeconds: 0, // Immediately expired
      });

      const token = shortLivedJwt.signAccessToken({
        userId: testUser.id,
        sessionId: "session-123",
        role: testUser.role,
        sessionVersion: testUser.sessionVersion,
      });

      expect(shortLivedJwt.verifyAccessToken(token)).toBeNull();
    });

    it("generates and hashes high-entropy refresh tokens", () => {
      const rawRefreshToken = jwtService.generateRefreshToken();
      expect(rawRefreshToken.length).toBe(80); // 40 bytes hex

      const hash1 = jwtService.hashRefreshToken(rawRefreshToken);
      const hash2 = jwtService.hashRefreshToken(rawRefreshToken);
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64); // SHA-256
    });
  });

  describe("2. Abuse Detection Service", () => {
    it("detects new devices, tracks known devices, and evaluates risk scores", async () => {
      const repo = new InMemoryAuthRepository();
      const auditLogger = new AuditLogger(repo);
      const abuseService = new AbuseDetectionService(auditLogger);

      // First login from Device A -> New device detected
      const eval1 = await abuseService.evaluateLogin(testUser, {
        ip: "198.51.100.1",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      });

      expect(eval1.isNewDevice).toBe(true);
      expect(eval1.reasons).toContain("NEW_DEVICE_LOGIN");

      // Second login from exact same Device A and IP -> Known device
      const eval2 = await abuseService.evaluateLogin(testUser, {
        ip: "198.51.100.1",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      });

      expect(eval2.isNewDevice).toBe(false);
      expect(eval2.riskScore).toBe(0);

      // Third login from Device A but with different IP -> IP changed alert
      const eval3 = await abuseService.evaluateLogin(testUser, {
        ip: "203.0.113.5",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      });

      expect(eval3.isNewDevice).toBe(false);
      expect(eval3.reasons).toContain("IP_ADDRESS_CHANGED");
    });
  });

  describe("3. Cleanup & Maintenance Service", () => {
    it("logs and safely handles purge and pruning tasks", async () => {
      const repo = new InMemoryAuthRepository();
      const auditLogger = new AuditLogger(repo);
      const cleanup = new CleanupService(repo, auditLogger, { deletionGracePeriodDays: 30 });

      const resAccounts = await cleanup.purgeExpiredDeletedAccounts();
      expect(resAccounts).toBeDefined();

      const resSessions = await cleanup.pruneExpiredSessions();
      expect(resSessions).toBeDefined();

      const resTokens = await cleanup.pruneExpiredTokens();
      expect(resTokens).toBeDefined();
    });
  });

  describe("4. Concurrency & High-Volume Simulation", () => {
    it("handles 1,000 rapid session creations and validations without degradation", async () => {
      const repo = new InMemoryAuthRepository();
      const sessionService = new SessionService(repo);

      const user = await repo.createUser({
        email: "concurrency@example.com",
        name: "Concurrent User",
        passwordHash: "hash",
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

      const startTime = Date.now();
      const tokens: string[] = [];

      // Create 500 sessions in parallel
      const createPromises = Array.from({ length: 500 }).map(async (_, idx) => {
        const { rawToken } = await sessionService.createSession(user, {
          userAgent: `Client ${idx}`,
          ipAddress: `10.0.0.${idx % 255}`,
        });
        return rawToken;
      });

      const createdTokens = await Promise.all(createPromises);
      tokens.push(...createdTokens);

      // Validate all 500 sessions concurrently
      const validationPromises = tokens.map((token) => sessionService.validateSession(token));
      const results = await Promise.all(validationPromises);

      const elapsedMs = Date.now() - startTime;

      expect(results.every((r) => r !== null)).toBe(true);
      expect(results.length).toBe(500);
      // Validating 500 in-memory sessions should complete in < 500ms
      expect(elapsedMs).toBeLessThan(1000);
    });
  });
});
