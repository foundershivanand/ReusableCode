import { describe, it, expect, beforeEach } from "vitest";
import { AuditLogService } from "../server/audit-service.js";
import { InMemoryAuditRepository } from "../server/repository.js";

describe("Module 13: Audit Logs & Activity Stream", () => {
  let repository: InMemoryAuditRepository;
  let service: AuditLogService;

  beforeEach(() => {
    repository = new InMemoryAuditRepository();
    service = new AuditLogService(repository);
  });

  it("appends audit log with server timestamp and cryptographic hash", async () => {
    const entry = await service.logActivity({
      tenantId: "tenant_corp",
      actor: { id: "usr_1", type: "USER", email: "alice@corp.com" },
      action: "PROJECT_CREATED",
      target: { id: "proj_99", type: "PROJECT", name: "Alpha" },
      metadata: { description: "Main product launch" }
    });

    expect(entry.id).toBeDefined();
    expect(entry.hash).toBeDefined();
    expect(entry.previousHash).toBe("0000000000000000");
    expect(entry.action).toBe("PROJECT_CREATED");
  });

  it("scrubs secrets automatically from beforeState, afterState, and metadata", async () => {
    const entry = await service.logActivity({
      tenantId: "tenant_corp",
      actor: { id: "adm_1", type: "ADMIN" },
      action: "PASSWORD_CHANGED",
      target: { id: "usr_1", type: "USER" },
      beforeState: { passwordHash: "xyz", oldPassword: "mypassword123", email: "alice@corp.com" },
      afterState: { newPassword: "newpassword456", apiKey: "sk_live_secret123" },
      metadata: { secretToken: "jwt_token_here", publicNote: "Updated by admin" }
    });

    expect(entry.beforeState?.oldPassword).toBe("[REDACTED]");
    expect(entry.beforeState?.email).toBe("alice@corp.com");
    expect(entry.afterState?.newPassword).toBe("[REDACTED]");
    expect(entry.afterState?.apiKey).toBe("[REDACTED]");
    expect(entry.metadata.secretToken).toBe("[REDACTED]");
    expect(entry.metadata.publicNote).toBe("Updated by admin");
  });

  it("records admin delegation and impersonation explicitly", async () => {
    const entry = await service.logActivity({
      tenantId: "tenant_corp",
      actor: {
        id: "usr_1",
        type: "USER",
        email: "alice@corp.com",
        impersonator: {
          id: "adm_super",
          email: "support@corp.com",
          reason: "Support Ticket #404"
        }
      },
      action: "SETTINGS_UPDATED",
      target: { id: "settings_1", type: "SETTINGS" }
    });

    expect(entry.actor.impersonator).toBeDefined();
    expect(entry.actor.impersonator?.id).toBe("adm_super");
    expect(entry.actor.impersonator?.reason).toBe("Support Ticket #404");
  });

  it("verifies cryptographic hash chain integrity and detects tampering", async () => {
    // Write 3 consecutive log entries
    const e1 = await service.logActivity({
      tenantId: "tenant_corp",
      actor: { id: "u1", type: "USER" },
      action: "LOGIN",
      target: { id: "session_1", type: "SESSION" }
    });

    const e2 = await service.logActivity({
      tenantId: "tenant_corp",
      actor: { id: "u1", type: "USER" },
      action: "PROJECT_CREATED",
      target: { id: "proj_1", type: "PROJECT" }
    });

    const e3 = await service.logActivity({
      tenantId: "tenant_corp",
      actor: { id: "u1", type: "USER" },
      action: "LOGOUT",
      target: { id: "session_1", type: "SESSION" }
    });

    // Hash chain: e2.previousHash === e1.hash, e3.previousHash === e2.hash
    expect(e2.previousHash).toBe(e1.hash);
    expect(e3.previousHash).toBe(e2.hash);

    // Initial integrity check passes
    const check1 = await service.verifyIntegrity("tenant_corp");
    expect(check1.valid).toBe(true);

    // Tamper test: modify e2 action directly in memory
    const rawLogs = (repository as any).tenantLogs.get("tenant_corp");
    rawLogs[1].action = "PROJECT_DELETED"; // unauthorized rewrite

    // Integrity check must now fail and pinpoint the compromised index!
    const check2 = await service.verifyIntegrity("tenant_corp");
    expect(check2.valid).toBe(false);
    expect(check2.compromisedIndex).toBe(1);
  });

  it("supports filtering and cursor pagination", async () => {
    await service.logActivity({
      tenantId: "tenant_filter",
      actor: { id: "u1", type: "USER" },
      action: "LOGIN",
      target: { id: "s1", type: "SESSION" }
    });
    await service.logActivity({
      tenantId: "tenant_filter",
      actor: { id: "u2", type: "ADMIN" },
      action: "PLAN_CHANGED",
      target: { id: "org_1", type: "ORG" }
    });

    // Filter by action
    const loginLogs = await service.queryLogs({
      tenantId: "tenant_filter",
      action: "LOGIN",
      limit: 10
    });
    expect(loginLogs.entries.length).toBe(1);
    expect(loginLogs.entries[0].action).toBe("LOGIN");

    // Filter by actor type
    const adminLogs = await service.queryLogs({
      tenantId: "tenant_filter",
      actorType: "ADMIN",
      limit: 10
    });
    expect(adminLogs.entries.length).toBe(1);
    expect(adminLogs.entries[0].actor.type).toBe("ADMIN");
  });
});
