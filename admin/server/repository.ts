import type {
  AdminUser,
  AdminSession,
  AdminAuditLog,
  BreakGlassEvent,
  DashboardStats
} from "../schemas/index.js";

export interface AdminRepository {
  getAdminById(id: string): Promise<AdminUser | null>;
  getAdminByEmail(email: string): Promise<AdminUser | null>;
  createAdminSession(session: AdminSession): Promise<AdminSession>;
  getAdminSessionByTokenHash(tokenHash: string): Promise<AdminSession | null>;
  touchAdminSession(id: string, expiresAt: Date): Promise<void>;
  revokeAdminSession(id: string): Promise<void>;

  createAuditLog(log: AdminAuditLog): Promise<AdminAuditLog>;
  listAuditLogs(filter?: {
    adminId?: string;
    targetId?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdminAuditLog[]>;

  createBreakGlassEvent(event: BreakGlassEvent): Promise<BreakGlassEvent>;
  getActiveBreakGlassEvent(adminId: string): Promise<BreakGlassEvent | null>;
  revokeBreakGlassEvent(id: string): Promise<void>;

  getDashboardStats(): Promise<DashboardStats>;
}

export class InMemoryAdminRepository implements AdminRepository {
  private admins: Map<string, AdminUser> = new Map();
  private sessions: Map<string, AdminSession> = new Map();
  private auditLogs: AdminAuditLog[] = [];
  private breakGlassEvents: Map<string, BreakGlassEvent> = new Map();

  constructor() {
    // Seed default super admin
    const now = new Date();
    this.admins.set("admin_root", {
      id: "admin_root",
      email: "root@example.com",
      name: "Security Root",
      role: "SUPER_ADMIN",
      mfaEnforced: true,
      mfaVerified: true,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
  }

  async getAdminById(id: string): Promise<AdminUser | null> {
    const a = this.admins.get(id);
    return a ? { ...a } : null;
  }

  async getAdminByEmail(email: string): Promise<AdminUser | null> {
    for (const a of this.admins.values()) {
      if (a.email.toLowerCase() === email.toLowerCase()) {
        return { ...a };
      }
    }
    return null;
  }

  async createAdminSession(session: AdminSession): Promise<AdminSession> {
    this.sessions.set(session.id, { ...session });
    return { ...session };
  }

  async getAdminSessionByTokenHash(tokenHash: string): Promise<AdminSession | null> {
    for (const s of this.sessions.values()) {
      if (s.tokenHash === tokenHash && !s.revokedAt) {
        return { ...s };
      }
    }
    return null;
  }

  async touchAdminSession(id: string, expiresAt: Date): Promise<void> {
    const s = this.sessions.get(id);
    if (s) {
      s.lastActiveAt = new Date();
      s.expiresAt = expiresAt;
      this.sessions.set(id, s);
    }
  }

  async revokeAdminSession(id: string): Promise<void> {
    const s = this.sessions.get(id);
    if (s) {
      s.revokedAt = new Date();
      this.sessions.set(id, s);
    }
  }

  async createAuditLog(log: AdminAuditLog): Promise<AdminAuditLog> {
    this.auditLogs.unshift({ ...log });
    return { ...log };
  }

  async listAuditLogs(filter: {
    adminId?: string;
    targetId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<AdminAuditLog[]> {
    const limit = Math.min(filter.limit || 50, 100); // capped query limit
    const offset = filter.offset || 0;

    let filtered = this.auditLogs;
    if (filter.adminId) {
      filtered = filtered.filter((l) => l.adminId === filter.adminId);
    }
    if (filter.targetId) {
      filtered = filtered.filter((l) => l.targetId === filter.targetId);
    }

    return filtered.slice(offset, offset + limit).map((l) => ({ ...l }));
  }

  async createBreakGlassEvent(event: BreakGlassEvent): Promise<BreakGlassEvent> {
    this.breakGlassEvents.set(event.id, { ...event });
    return { ...event };
  }

  async getActiveBreakGlassEvent(adminId: string): Promise<BreakGlassEvent | null> {
    const now = new Date();
    for (const e of this.breakGlassEvents.values()) {
      if (e.adminId === adminId && !e.revokedAt && e.expiresAt > now) {
        return { ...e };
      }
    }
    return null;
  }

  async revokeBreakGlassEvent(id: string): Promise<void> {
    const e = this.breakGlassEvents.get(id);
    if (e) {
      e.revokedAt = new Date();
      this.breakGlassEvents.set(id, e);
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return {
      activeUsers: 1420,
      revenueMinorUnits: 2540000, // $25,400.00
      activeSubscriptions: 890,
      errorCountLast24h: 12,
      failedJobsCount: 2,
      webhookFailuresLast24h: 0
    };
  }
}
