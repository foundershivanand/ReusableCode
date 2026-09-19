import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ServerPipeline } from "../server/pipeline.js";
import { SessionService } from "../server/session-service.js";
import { AuditLogger } from "../server/audit-logger.js";
import { InMemoryAuthRepository } from "../server/repository.js";

describe("Formal Server Pipeline", () => {
  function setup() {
    const repo = new InMemoryAuthRepository();
    const sessionService = new SessionService(repo);
    const auditLogger = new AuditLogger(repo);
    const pipeline = new ServerPipeline(sessionService, auditLogger);
    return { repo, sessionService, auditLogger, pipeline };
  }

  it("rejects oversized request body with 413 Payload Too Large", async () => {
    const { pipeline } = setup();

    const oversizedBody = { data: "x".repeat(2000) };

    const res = await pipeline.execute(
      { body: oversizedBody },
      {
        maxBodySizeBytes: 1000,
        handler: async () => ({ success: true }),
      }
    );

    expect(res.status).toBe(413);
    expect(res.error?.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("rejects invalid input schema with 400 Validation Error", async () => {
    const { pipeline } = setup();

    const schema = z.object({ email: z.string().email() });

    const res = await pipeline.execute(
      { body: { email: "not-an-email" } },
      {
        inputSchema: schema,
        handler: async () => ({ success: true }),
      }
    );

    expect(res.status).toBe(400);
    expect(res.error?.code).toBe("VALIDATION_ERROR");
  });

  it("enforces authentication and authorization in pipeline", async () => {
    const { pipeline, repo, sessionService } = setup();

    const user = await repo.createUser({
      email: "pip@example.com",
      name: "Pip",
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

    const { rawToken } = await sessionService.createSession(user);

    // Unauthenticated request to protected endpoint -> 401
    const res401 = await pipeline.execute(
      { headers: {} },
      {
        requireAuth: true,
        handler: async () => ({ ok: true }),
      }
    );
    expect(res401.status).toBe(401);

    // Authenticated but wrong role -> 403
    const res403 = await pipeline.execute(
      { headers: { authorization: `Bearer ${rawToken}` } },
      {
        requireAuth: true,
        requiredRole: "ADMIN",
        handler: async () => ({ ok: true }),
      }
    );
    expect(res403.status).toBe(403);

    // Authenticated with valid role -> 200
    const res200 = await pipeline.execute(
      { headers: { authorization: `Bearer ${rawToken}` } },
      {
        requireAuth: true,
        requiredRole: "USER",
        handler: async () => ({ ok: true }),
      }
    );
    expect(res200.status).toBe(200);
    expect(res200.data).toEqual({ ok: true });
  });
});
