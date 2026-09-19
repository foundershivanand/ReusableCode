import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import {
  // Errors
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  RateLimitError,
  formatUserFacingError,
  // IDs
  generatePrefixedId,
  generateSortableId,
  generateSecureToken,
  isValidPrefixedId,
  extractTimestampFromId,
  // Secrets
  MemorySecretsManager,
  CachedSecretsManager,
  maskSecret,
  redactSensitiveObject,
  // Crypto
  encryptField,
  decryptField,
  reEncryptField,
  isEncryptedField,
  KeyRing,
  // Observability
  createTraceContext,
  runWithTraceContext,
  getTraceContext,
  // Authz
  defaultAuthorizationEngine,
  // Transactions & Saga
  InMemoryUnitOfWork,
  SagaCoordinator,
  // Idempotency
  IdempotencyManager,
  InMemoryIdempotencyStore,
  // Cache
  CacheManager,
  InMemoryCacheStore,
  buildCacheKey,
  // Jobs
  BackgroundJobQueue,
  // Lifecycle
  initializeLifecycle,
  softDeleteEntity,
  isEntityExpired,
  handleOwnerDeletionCascade,
  exportEntityData,
  // Pipeline
  executePipeline,
} from "../index.js";

describe("Universal Core Platform & Resilience Architecture", () => {
  describe("A & B. Universal Request Pipeline & Error System", () => {
    const inputSchema = z.object({
      name: z.string().min(3),
      amount: z.number().positive(),
    });

    const outputSchema = z.object({
      id: z.string(),
      status: z.string(),
      name: z.string(),
    });

    it("should execute full 10-step pipeline successfully and propagate trace context", async () => {
      let auditCalled = false;

      const response = await executePipeline(
        {
          inputSchema,
          outputSchema,
          requireAuth: true,
          action: "item:create",
          transactional: true,
          handler: async (ctx) => {
            expect(ctx.actor?.id).toBe("usr_123");
            expect(ctx.tenantId).toBe("tenant_abc");
            expect(ctx.traceContext.traceId).toBeDefined();
            return {
              id: "item_001",
              status: "CREATED",
              name: ctx.input.name,
            };
          },
          auditEvent: async (ctx, result) => {
            auditCalled = true;
            expect(result.id).toBe("item_001");
          },
        },
        {
          actor: { id: "usr_123", tenantId: "tenant_abc", roles: ["TENANT_ADMIN"] },
          tenantId: "tenant_abc",
          body: { name: "Sample Item", amount: 150 },
        }
      );

      expect(response.statusCode).toBe(200);
      expect(response.headers["x-request-id"]).toBeDefined();
      expect(response.headers["x-trace-id"]).toBeDefined();
      expect((response.body as any).status).toBe("CREATED");
      expect(auditCalled).toBe(true);
    });

    it("should reject malicious or invalid input without leaking internal details", async () => {
      const response = await executePipeline(
        {
          inputSchema,
          outputSchema,
          handler: async () => ({ id: "1", status: "OK", name: "test" }),
        },
        {
          actor: { id: "usr_123", tenantId: "tenant_abc", roles: ["TENANT_ADMIN"] },
          body: { name: "x", amount: -50 }, // Invalid input
        }
      );

      expect(response.statusCode).toBe(400);
      const body = response.body as any;
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toBe("The provided data is invalid. Please correct the errors and try again.");
      expect(body.error.requestId).toBeDefined();
    });

    it("should enforce authentication and tenant authorization in pipeline", async () => {
      // Unauthenticated
      const unauthResponse = await executePipeline(
        {
          requireAuth: true,
          handler: async () => ({ ok: true }),
        },
        { body: {} }
      );
      expect(unauthResponse.statusCode).toBe(401);

      // Unauthorized cross-tenant attempt
      const unauthzResponse = await executePipeline(
        {
          requireAuth: true,
          action: "secret:read",
          resource: () => ({ type: "secret", tenantId: "tenant_target" }),
          handler: async () => ({ ok: true }),
        },
        {
          actor: { id: "attacker", tenantId: "tenant_attacker", roles: ["MEMBER"] },
          tenantId: "tenant_target",
          body: {},
        }
      );
      expect(unauthzResponse.statusCode).toBe(403);
    });

    it("should enforce rate limiting and abuse controls", async () => {
      const rateLimitedPipeline = {
        rateLimit: {
          key: (req: any) => `ip:${req.ipAddress}`,
          limit: 2,
          windowMs: 60000,
        },
        requireAuth: false,
        handler: async () => ({ ok: true }),
      };

      const req = { ipAddress: "203.0.113.195", body: {} };
      const res1 = await executePipeline(rateLimitedPipeline, req);
      expect(res1.statusCode).toBe(200);

      const res2 = await executePipeline(rateLimitedPipeline, req);
      expect(res2.statusCode).toBe(200);

      const res3 = await executePipeline(rateLimitedPipeline, req);
      expect(res3.statusCode).toBe(429);
      expect((res3.body as any).error.code).toBe("RATE_LIMIT_EXCEEDED");
    });
  });

  describe("C. Universal ID Strategy", () => {
    it("should generate sortable, prefixed, and valid IDs with timestamp extraction", () => {
      const id1 = generatePrefixedId("usr");
      const id2 = generatePrefixedId("usr");

      expect(id1.startsWith("usr_")).toBe(true);
      expect(isValidPrefixedId(id1, "usr")).toBe(true);
      expect(isValidPrefixedId(id1, "org")).toBe(false);

      const timestamp = extractTimestampFromId(id1);
      expect(timestamp).toBeGreaterThan(Date.now() - 5000);
      expect(timestamp).toBeLessThanOrEqual(Date.now());

      // Enumeration resistance: IDs are not predictable
      const token = generateSecureToken("sec", 16);
      expect(token.startsWith("sec_")).toBe(true);
      expect(token.length).toBeGreaterThan(32);
    });
  });

  describe("D. Universal Transaction Strategy & Saga Compensation", () => {
    it("should execute Saga steps sequentially and roll back in reverse order upon failure", async () => {
      const saga = new SagaCoordinator<{ paymentDone: boolean; entitlementGranted: boolean; usageUpdated: boolean }>();
      const context = { paymentDone: false, entitlementGranted: false, usageUpdated: false };

      saga
        .addStep({
          name: "CapturePayment",
          execute: async (ctx) => {
            ctx.paymentDone = true;
          },
          compensate: async (ctx) => {
            ctx.paymentDone = false;
          },
        })
        .addStep({
          name: "GrantEntitlement",
          execute: async (ctx) => {
            ctx.entitlementGranted = true;
          },
          compensate: async (ctx) => {
            ctx.entitlementGranted = false;
          },
        })
        .addStep({
          name: "UpdateUsage",
          execute: async () => {
            throw new Error("Database connection dropped during usage update!");
          },
          compensate: async (ctx) => {
            ctx.usageUpdated = false;
          },
        });

      await expect(saga.execute(context)).rejects.toThrow("Database connection dropped");
      // Verify rollback occurred
      expect(context.paymentDone).toBe(false);
      expect(context.entitlementGranted).toBe(false);
      expect(context.usageUpdated).toBe(false);
    });
  });

  describe("E. Universal Idempotency Framework", () => {
    it("should replay stored result on identical request and detect conflict on payload mismatch", async () => {
      const manager = new IdempotencyManager(new InMemoryIdempotencyStore());
      let executionCount = 0;

      const handler = async () => {
        executionCount++;
        return { statusCode: 201, body: { orderId: "ord_999" } };
      };

      // 1. Initial execution
      const res1 = await manager.execute({
        key: "idem_key_1",
        method: "POST",
        path: "/api/orders",
        body: { amount: 100 },
        tenantId: "tenant_1",
        handler,
      });

      expect(res1.isReplay).toBe(false);
      expect(res1.body.orderId).toBe("ord_999");
      expect(executionCount).toBe(1);

      // 2. Replay with identical key & payload
      const res2 = await manager.execute({
        key: "idem_key_1",
        method: "POST",
        path: "/api/orders",
        body: { amount: 100 },
        tenantId: "tenant_1",
        handler,
      });

      expect(res2.isReplay).toBe(true);
      expect(res2.body.orderId).toBe("ord_999");
      expect(executionCount).toBe(1); // Handler was NOT executed again!

      // 3. Conflict on payload mismatch
      await expect(
        manager.execute({
          key: "idem_key_1",
          method: "POST",
          path: "/api/orders",
          body: { amount: 200 }, // Changed amount!
          tenantId: "tenant_1",
          handler,
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("F. Universal Authorization Engine", () => {
    it("should enforce RBAC, ABAC, and strict tenant isolation", async () => {
      // 1. Tenant Admin can perform any action in own tenant
      const adminAuth = await defaultAuthorizationEngine.authorize({
        actor: { id: "admin_1", tenantId: "tenant_A", roles: ["TENANT_ADMIN"] },
        action: "billing:refund",
        resource: { type: "invoice", tenantId: "tenant_A" },
        tenant: "tenant_A",
      });
      expect(adminAuth.allowed).toBe(true);

      // 2. Cross-tenant access is rejected
      const crossTenant = await defaultAuthorizationEngine.authorize({
        actor: { id: "admin_1", tenantId: "tenant_A", roles: ["TENANT_ADMIN"] },
        action: "billing:refund",
        resource: { type: "invoice", tenantId: "tenant_B" },
        tenant: "tenant_B",
      });
      expect(crossTenant.allowed).toBe(false);
      expect(crossTenant.reason).toContain("Cross-tenant access forbidden");

      // 3. Resource owner ABAC fallback
      const ownerAuth = await defaultAuthorizationEngine.authorize({
        actor: { id: "user_owner", tenantId: "tenant_A", roles: ["GUEST"] },
        action: "document:write",
        resource: { type: "document", tenantId: "tenant_A", ownerId: "user_owner" },
      });
      expect(ownerAuth.allowed).toBe(true);
    });
  });

  describe("G & H. Universal Secrets & Crypto Management", () => {
    it("should manage secrets with caching, masking, and object redaction", async () => {
      const mem = new MemorySecretsManager({ STRIPE_KEY: "sk_test_1234567890abcdef" });
      const cached = new CachedSecretsManager(mem, 5000);

      expect(await cached.getSecret("STRIPE_KEY")).toBe("sk_test_1234567890abcdef");
      expect(maskSecret("sk_test_1234567890abcdef")).toBe("********************cdef");

      const redacted = redactSensitiveObject({
        username: "shiva",
        password: "SuperSecretPassword123",
        apiKey: "api_key_xyz",
        nested: { token: "tok_secret" },
      });

      expect(redacted.username).toBe("shiva");
      expect(redacted.password).toBe("******************d123");
      expect(redacted.apiKey).toBe("*******_xyz");
      expect((redacted.nested as any).token).toBe("******cret");
    });

    it("should encrypt with AES-256-GCM, support key versioning, and re-encrypt on key rotation", () => {
      const keyRing: KeyRing = {
        activeVersion: "v1",
        keys: {
          v1: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
          v2: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
        },
      };

      const plain = "sensitive_customer_ssn_or_oauth_token";
      const cipherText = encryptField(plain, keyRing);

      expect(isEncryptedField(cipherText)).toBe(true);
      expect(cipherText.startsWith("enc:v1:")).toBe(true);
      expect(decryptField(cipherText, keyRing)).toBe(plain);

      // Rotate to v2
      keyRing.activeVersion = "v2";
      const { rotated, newCipherText } = reEncryptField(cipherText, keyRing);
      expect(rotated).toBe(true);
      expect(newCipherText.startsWith("enc:v2:")).toBe(true);
      expect(decryptField(newCipherText, keyRing)).toBe(plain);
    });
  });

  describe("I. Universal Data Lifecycle", () => {
    it("should handle soft delete, retention expiration, owner deletion cascades, and GDPR export", () => {
      const entity = {
        id: "doc_1",
        title: "Confidential Strategy",
        lifecycle: initializeLifecycle({
          ownerId: "usr_alice",
          tenantId: "tenant_1",
          retentionDays: 30,
          ownerDeletionPolicy: "CASCADE_DELETE",
        }),
      };

      expect(entity.lifecycle.isDeleted).toBe(false);
      expect(isEntityExpired(entity)).toBe(false);

      // Soft delete
      softDeleteEntity(entity, "usr_admin");
      expect(entity.lifecycle.isDeleted).toBe(true);
      expect(entity.lifecycle.deletedBy).toBe("usr_admin");

      // Owner deletion cascade
      const entities = [
        {
          id: "doc_2",
          lifecycle: initializeLifecycle({
            ownerId: "usr_bob",
            tenantId: "tenant_1",
            ownerDeletionPolicy: "CASCADE_DELETE",
          }),
        },
        {
          id: "doc_3",
          lifecycle: initializeLifecycle({
            ownerId: "usr_bob",
            tenantId: "tenant_1",
            ownerDeletionPolicy: "ANONYMIZE",
          }),
        },
      ];

      const afterCascade = handleOwnerDeletionCascade(entities, "usr_bob");
      expect(afterCascade[0].lifecycle.isDeleted).toBe(true);
      expect(afterCascade[1].lifecycle.ownerId).toBe("ANONYMIZED_USER");

      // Export only non-deleted, exportable entities
      const exported = exportEntityData(afterCascade);
      expect(exported.length).toBe(1);
      expect(exported[0].id).toBe("doc_3");
    });
  });

  describe("J. Universal Background Job Contract", () => {
    it("should enqueue, process, handle retries with backoff, and track job status", async () => {
      const queue = new BackgroundJobQueue();
      let attempts = 0;

      queue.registerHandler("process_webhook", async (payload: { event: string }) => {
        attempts++;
        if (attempts < 2) {
          throw new Error("Temporary network glitch");
        }
        return { delivered: true, event: payload.event };
      });

      const job = await queue.enqueue({
        name: "process_webhook",
        payload: { event: "invoice.paid" },
        retryPolicy: { maxAttempts: 3, initialBackoffMs: 10, backoffFactor: 2, maxBackoffMs: 50 },
      });

      expect(job.status).toBe("QUEUED");

      // Attempt 1 -> fails and retries
      const attempt1 = await queue.processJob(job.jobId);
      expect(attempt1.status).toBe("RETRYING");
      expect(attempt1.attempt).toBe(1);

      // Attempt 2 -> succeeds
      const attempt2 = await queue.processJob(job.jobId);
      expect(attempt2.status).toBe("COMPLETED");
      expect(attempt2.result).toEqual({ delivered: true, event: "invoice.paid" });
    });
  });

  describe("K & L. Observability & Universal Caching Rules", () => {
    it("should prevent cache stampede with single-flight mutex and enforce tenant isolation", async () => {
      const cache = new CacheManager(new InMemoryCacheStore());
      let fetchCount = 0;

      const slowFetcher = async () => {
        fetchCount++;
        await new Promise((r) => setTimeout(r, 20));
        return { data: "cached_result" };
      };

      const key = buildCacheKey({
        namespace: "users",
        tenantId: "tenant_1",
        resource: "profile",
        identifier: "usr_alice",
      });

      // Concurrent fetches trigger single-flight
      const [resA, resB, resC] = await Promise.all([
        cache.getOrSet(key, slowFetcher, { ttlSeconds: 60, tenantId: "tenant_1" }),
        cache.getOrSet(key, slowFetcher, { ttlSeconds: 60, tenantId: "tenant_1" }),
        cache.getOrSet(key, slowFetcher, { ttlSeconds: 60, tenantId: "tenant_1" }),
      ]);

      expect(resA).toEqual({ data: "cached_result" });
      expect(resB).toEqual({ data: "cached_result" });
      expect(resC).toEqual({ data: "cached_result" });
      expect(fetchCount).toBe(1); // Only 1 invocation to origin!

      // Cross-tenant cache check must fail
      await expect(
        cache.getOrSet(key, slowFetcher, { ttlSeconds: 60, tenantId: "tenant_2" })
      ).rejects.toThrow("Cache security violation: tenant mismatch");
    });
  });
});
