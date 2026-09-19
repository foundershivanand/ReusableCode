import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemoryAdminRepository,
  AdminService,
  AdminForbiddenError,
  AdminSessionExpiredError
} from "../server/index.js";
import type { AdminUser, AdminSession } from "../schemas/index.js";
import crypto from "node:crypto";

describe("Module 06 — Admin Dashboard & Operations Control", () => {
  let repository: InMemoryAdminRepository;
  let service: AdminService;
  let superAdmin: AdminUser;
  let supportAdmin: AdminUser;

  beforeEach(() => {
    repository = new InMemoryAdminRepository();
    service = new AdminService(repository);

    superAdmin = {
      id: "admin_super",
      email: "super@example.com",
      name: "Super Admin",
      role: "SUPER_ADMIN",
      mfaEnforced: true,
      mfaVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    supportAdmin = {
      id: "admin_support",
      email: "support@example.com",
      name: "Support Admin",
      role: "SUPPORT_ADMIN",
      mfaEnforced: true,
      mfaVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  describe("1. Admin Session & Inactivity Expiration", () => {
    it("validates active session and slides inactivity window", async () => {
      const rawToken = "test_admin_token_123";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      const session: AdminSession = {
        id: "sess_1",
        adminId: "admin_root",
        tokenHash,
        ipAddress: "127.0.0.1",
        userAgent: "Vitest",
        lastActiveAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        createdAt: new Date()
      };
      await repository.createAdminSession(session);

      const result = await service.validateAdminSession(rawToken);
      expect(result.admin.id).toBe("admin_root");
      expect(result.session.id).toBe("sess_1");
    });

    it("rejects session that has exceeded 15 minutes of inactivity", async () => {
      const rawToken = "inactive_token";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      const session: AdminSession = {
        id: "sess_inactive",
        adminId: "admin_root",
        tokenHash,
        ipAddress: "127.0.0.1",
        userAgent: "Vitest",
        lastActiveAt: new Date(Date.now() - 16 * 60 * 1000), // 16 mins ago
        expiresAt: new Date(Date.now() + 7 * 60 * 60 * 1000), // absolute still valid
        createdAt: new Date()
      };
      await repository.createAdminSession(session);

      await expect(service.validateAdminSession(rawToken)).rejects.toThrow(AdminSessionExpiredError);
    });
  });

  describe("2. Admin RBAC & Destructive Action Protections", () => {
    it("enforces role boundaries (SUPPORT_ADMIN cannot delete users)", async () => {
      await expect(
        service.executeAction({
          admin: supportAdmin,
          action: "USER_DELETE",
          targetType: "USER",
          targetId: "user_123",
          reason: "Testing permissions",
          ipAddress: "127.0.0.1",
          userAgent: "Vitest"
        })
      ).rejects.toThrow(AdminForbiddenError);
    });

    it("requires exact confirmation phrase for destructive user deletion", async () => {
      // Missing or wrong phrase
      await expect(
        service.executeAction({
          admin: superAdmin,
          action: "USER_DELETE",
          targetType: "USER",
          targetId: "user_123",
          reason: "User requested deletion",
          ipAddress: "127.0.0.1",
          userAgent: "Vitest",
          confirmationPhrase: "delete"
        })
      ).rejects.toThrow('Action requires exact confirmation phrase "DELETE USER"');

      // Correct phrase succeeds
      const log = await service.executeAction({
        admin: superAdmin,
        action: "USER_DELETE",
        targetType: "USER",
        targetId: "user_123",
        reason: "User requested deletion",
        ipAddress: "127.0.0.1",
        userAgent: "Vitest",
        confirmationPhrase: "DELETE USER"
      });

      expect(log.id).toBeDefined();
      expect(log.action).toBe("USER_DELETE");
    });
  });

  describe("3. Safe Impersonation", () => {
    it("starts impersonation session and records audit trail", async () => {
      const result = await service.startImpersonation({
        admin: supportAdmin,
        targetUserId: "user_troubleshoot",
        reason: "Investigating customer checkout failure",
        ipAddress: "127.0.0.1",
        userAgent: "Vitest"
      });

      expect(result.impersonationToken).toBeDefined();
      expect(result.auditLog.action).toBe("USER_IMPERSONATE_START");
      expect(result.auditLog.targetId).toBe("user_troubleshoot");
    });
  });

  describe("4. Emergency Break-Glass Access", () => {
    it("allows SUPER_ADMIN to activate emergency access with justification", async () => {
      const event = await service.activateBreakGlass({
        admin: superAdmin,
        reason: "Production database connectivity incident INC-9901",
        durationMinutes: 45,
        ipAddress: "127.0.0.1",
        userAgent: "Vitest"
      });

      expect(event.id).toBeDefined();
      expect(event.durationMinutes).toBe(45);
      expect(event.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("prevents non-super-admins from activating break-glass", async () => {
      await expect(
        service.activateBreakGlass({
          admin: supportAdmin,
          reason: "Testing",
          durationMinutes: 30,
          ipAddress: "127.0.0.1",
          userAgent: "Vitest"
        })
      ).rejects.toThrow(AdminForbiddenError);
    });
  });

  describe("5. Bounded Bulk Actions & Audit Query Limits", () => {
    it("executes bounded bulk actions with partial failure resilience", async () => {
      const result = await service.executeBulkAction({
        admin: superAdmin,
        input: {
          action: "USER_SUSPEND",
          targetIds: ["user_1", "user_2", "user_3"],
          reason: "Spam bot wave detected"
        },
        ipAddress: "127.0.0.1",
        userAgent: "Vitest"
      });

      expect(result.successful.length).toBe(3);
      expect(result.failed.length).toBe(0);

      const logs = await service.listAuditLogs(superAdmin, { limit: 10 });
      expect(logs.length).toBeGreaterThanOrEqual(3);
    });
  });
});
