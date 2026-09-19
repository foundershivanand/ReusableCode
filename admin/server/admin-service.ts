import crypto from "node:crypto";
import type { AdminRepository } from "./repository.js";
import type {
  AdminUser,
  AdminSession,
  AdminRole,
  AdminActionType,
  AdminAuditLog,
  BreakGlassEvent,
  DashboardStats,
  BulkActionInput
} from "../schemas/index.js";

export class AdminUnauthorizedError extends Error {
  public readonly code = "ADMIN_UNAUTHORIZED";
  constructor(message = "Admin authorization required") {
    super(message);
    this.name = "AdminUnauthorizedError";
  }
}

export class AdminForbiddenError extends Error {
  public readonly code = "ADMIN_FORBIDDEN";
  constructor(action: string, role: AdminRole) {
    super(`Admin role "${role}" is not permitted to perform "${action}"`);
    this.name = "AdminForbiddenError";
  }
}

export class AdminSessionExpiredError extends Error {
  public readonly code = "ADMIN_SESSION_EXPIRED";
  constructor() {
    super("Admin session has expired due to inactivity or absolute lifetime");
    this.name = "AdminSessionExpiredError";
  }
}

export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
export const ABSOLUTE_LIFETIME_MS = 8 * 60 * 60 * 1000; // 8 hours

const ROLE_ALLOWED_ACTIONS: Record<AdminRole, Set<AdminActionType>> = {
  SUPER_ADMIN: new Set<AdminActionType>([
    "USER_SUSPEND",
    "USER_ACTIVATE",
    "USER_DELETE",
    "USER_IMPERSONATE_START",
    "USER_IMPERSONATE_END",
    "ORGANIZATION_SUSPEND",
    "ORGANIZATION_DELETE",
    "PAYMENT_REFUND",
    "JOB_RETRY",
    "JOB_CANCEL",
    "FEATURE_FLAG_TOGGLE",
    "BREAK_GLASS_ACTIVATE",
    "SYSTEM_SETTING_UPDATE"
  ]),
  SUPPORT_ADMIN: new Set<AdminActionType>([
    "USER_SUSPEND",
    "USER_ACTIVATE",
    "USER_IMPERSONATE_START",
    "USER_IMPERSONATE_END",
    "JOB_RETRY"
  ]),
  BILLING_ADMIN: new Set<AdminActionType>([
    "PAYMENT_REFUND",
    "ORGANIZATION_SUSPEND"
  ]),
  READONLY_ADMIN: new Set<AdminActionType>([])
};

export class AdminService {
  constructor(private repository: AdminRepository) {}

  /**
   * Validates an admin session token against inactivity timeout and absolute expiration
   */
  async validateAdminSession(rawToken: string): Promise<{ admin: AdminUser; session: AdminSession }> {
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const session = await this.repository.getAdminSessionByTokenHash(tokenHash);

    if (!session) {
      throw new AdminUnauthorizedError("Invalid admin session");
    }

    const now = new Date();
    // Check absolute expiration
    if (session.expiresAt < now) {
      throw new AdminSessionExpiredError();
    }

    // Check inactivity timeout (15 mins)
    if (now.getTime() - session.lastActiveAt.getTime() > INACTIVITY_TIMEOUT_MS) {
      await this.repository.revokeAdminSession(session.id);
      throw new AdminSessionExpiredError();
    }

    const admin = await this.repository.getAdminById(session.adminId);
    if (!admin || !admin.isActive) {
      throw new AdminUnauthorizedError("Admin user inactive or deleted");
    }

    // Touch session with sliding inactivity window (capped by absolute expiresAt)
    const nextInactivity = new Date(now.getTime() + INACTIVITY_TIMEOUT_MS);
    const newExpiresAt = nextInactivity < session.expiresAt ? nextInactivity : session.expiresAt;
    await this.repository.touchAdminSession(session.id, newExpiresAt);

    return { admin, session };
  }

  /**
   * Asserts that an admin has permission to perform an action
   */
  assertAdminPermission(admin: AdminUser, action: AdminActionType): void {
    const allowed = ROLE_ALLOWED_ACTIONS[admin.role];
    if (!allowed || !allowed.has(action)) {
      throw new AdminForbiddenError(action, admin.role);
    }
  }

  /**
   * Executes an audited admin action with mandatory reason and IP tracking
   */
  async executeAction(params: {
    admin: AdminUser;
    action: AdminActionType;
    targetType: AdminAuditLog["targetType"];
    targetId: string;
    reason: string;
    ipAddress: string;
    userAgent: string;
    details?: Record<string, any>;
    confirmationPhrase?: string;
  }): Promise<AdminAuditLog> {
    this.assertAdminPermission(params.admin, params.action);

    // Confirmation phrase checks for destructive actions
    if (params.action === "USER_DELETE" && params.confirmationPhrase !== "DELETE USER") {
      throw new Error('Action requires exact confirmation phrase "DELETE USER"');
    }
    if (params.action === "ORGANIZATION_DELETE" && params.confirmationPhrase !== "DELETE ORGANIZATION") {
      throw new Error('Action requires exact confirmation phrase "DELETE ORGANIZATION"');
    }

    // Create immutable audit log
    const log: AdminAuditLog = {
      id: `audit_${crypto.randomUUID()}`,
      adminId: params.admin.id,
      adminEmail: params.admin.email,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      reason: params.reason,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      details: params.details || {},
      timestamp: new Date()
    };

    return this.repository.createAuditLog(log);
  }

  /**
   * Start safe user impersonation with time limit and complete audit log
   */
  async startImpersonation(params: {
    admin: AdminUser;
    targetUserId: string;
    reason: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<{ impersonationToken: string; expiresAt: Date; auditLog: AdminAuditLog }> {
    this.assertAdminPermission(params.admin, "USER_IMPERSONATE_START");

    const auditLog = await this.executeAction({
      admin: params.admin,
      action: "USER_IMPERSONATE_START",
      targetType: "USER",
      targetId: params.targetUserId,
      reason: params.reason,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      details: { impersonatedUserId: params.targetUserId }
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minute maximum impersonation

    return {
      impersonationToken: rawToken,
      expiresAt,
      auditLog
    };
  }

  /**
   * Activate break-glass emergency administrative access
   */
  async activateBreakGlass(params: {
    admin: AdminUser;
    reason: string;
    durationMinutes: number;
    ipAddress: string;
    userAgent: string;
  }): Promise<BreakGlassEvent> {
    if (params.admin.role !== "SUPER_ADMIN") {
      throw new AdminForbiddenError("BREAK_GLASS_ACTIVATE", params.admin.role);
    }

    const duration = Math.min(Math.max(params.durationMinutes, 5), 120);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 60 * 1000);

    const event: BreakGlassEvent = {
      id: `bg_${crypto.randomUUID()}`,
      adminId: params.admin.id,
      reason: params.reason,
      durationMinutes: duration,
      activatedAt: now,
      expiresAt
    };

    await this.repository.createBreakGlassEvent(event);

    await this.executeAction({
      admin: params.admin,
      action: "BREAK_GLASS_ACTIVATE",
      targetType: "SYSTEM",
      targetId: event.id,
      reason: params.reason,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      details: { durationMinutes: duration, expiresAt }
    });

    return event;
  }

  /**
   * Execute bounded bulk admin actions with partial-failure handling
   */
  async executeBulkAction(params: {
    admin: AdminUser;
    input: BulkActionInput;
    ipAddress: string;
    userAgent: string;
  }): Promise<{ successful: string[]; failed: { id: string; error: string }[] }> {
    this.assertAdminPermission(params.admin, params.input.action);

    const successful: string[] = [];
    const failed: { id: string; error: string }[] = [];

    // Max 100 bounded batch
    const targets = params.input.targetIds.slice(0, 100);

    for (const targetId of targets) {
      try {
        await this.executeAction({
          admin: params.admin,
          action: params.input.action,
          targetType: "USER",
          targetId,
          reason: `Bulk action: ${params.input.reason}`,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent
        });
        successful.push(targetId);
      } catch (err) {
        failed.push({
          id: targetId,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    return { successful, failed };
  }

  async getDashboardStats(admin: AdminUser): Promise<DashboardStats> {
    // Any valid admin can view dashboard overview
    if (!admin.isActive) throw new AdminUnauthorizedError();
    return this.repository.getDashboardStats();
  }

  async listAuditLogs(
    admin: AdminUser,
    filter?: { targetId?: string; limit?: number; offset?: number }
  ): Promise<AdminAuditLog[]> {
    if (!admin.isActive) throw new AdminUnauthorizedError();
    return this.repository.listAuditLogs(filter);
  }
}
