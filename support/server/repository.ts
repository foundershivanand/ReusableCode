import type {
  SupportTicket,
  ImpersonationSession
} from "../schemas/support-schemas.js";

export interface ISupportRepository {
  saveTicket(ticket: SupportTicket): Promise<SupportTicket>;
  getTicket(id: string): Promise<SupportTicket | null>;
  listTickets(tenantId: string, status?: string): Promise<SupportTicket[]>;
  findRecentDuplicate(tenantId: string, contentHash: string, windowMs: number): Promise<SupportTicket | null>;
  saveImpersonationSession(session: ImpersonationSession): Promise<ImpersonationSession>;
  getImpersonationSession(id: string): Promise<ImpersonationSession | null>;
  revokeImpersonationSession(id: string): Promise<void>;
}

export class InMemorySupportRepository implements ISupportRepository {
  private tickets: Map<string, SupportTicket> = new Map();
  private sessions: Map<string, ImpersonationSession> = new Map();

  async saveTicket(ticket: SupportTicket): Promise<SupportTicket> {
    const updated = { ...ticket, updatedAt: new Date() };
    this.tickets.set(ticket.id, JSON.parse(JSON.stringify(updated)));
    return updated;
  }

  async getTicket(id: string): Promise<SupportTicket | null> {
    const t = this.tickets.get(id);
    return t ? JSON.parse(JSON.stringify(t)) : null;
  }

  async listTickets(tenantId: string, status?: string): Promise<SupportTicket[]> {
    let all = Array.from(this.tickets.values()).filter((t) => t.tenantId === tenantId);
    if (status) {
      all = all.filter((t) => t.status === status);
    }
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findRecentDuplicate(
    tenantId: string,
    contentHash: string,
    windowMs: number
  ): Promise<SupportTicket | null> {
    const cutoff = Date.now() - windowMs;
    for (const t of this.tickets.values()) {
      if (
        t.tenantId === tenantId &&
        t.contentHash === contentHash &&
        new Date(t.createdAt).getTime() >= cutoff
      ) {
        return JSON.parse(JSON.stringify(t));
      }
    }
    return null;
  }

  async saveImpersonationSession(session: ImpersonationSession): Promise<ImpersonationSession> {
    this.sessions.set(session.id, JSON.parse(JSON.stringify(session)));
    return session;
  }

  async getImpersonationSession(id: string): Promise<ImpersonationSession | null> {
    const s = this.sessions.get(id);
    return s ? JSON.parse(JSON.stringify(s)) : null;
  }

  async revokeImpersonationSession(id: string): Promise<void> {
    const s = this.sessions.get(id);
    if (s) {
      s.revoked = true;
      this.sessions.set(id, s);
    }
  }
}
