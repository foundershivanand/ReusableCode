import { createHash, randomUUID } from "node:crypto";
import type { ISupportRepository } from "./repository.js";
import type { ISupportProvider } from "../providers/support-provider.js";
import { MockSupportAdapter } from "../providers/support-provider.js";
import {
  type SupportTicket,
  type CreateTicketInput,
  type TicketStatus,
  type ImpersonationSession,
  CreateTicketInputSchema
} from "../schemas/support-schemas.js";

export class SupportService {
  private userRequestTimestamps: Map<string, number[]> = new Map();
  private provider: ISupportProvider;

  constructor(
    private readonly repository: ISupportRepository,
    provider?: ISupportProvider
  ) {
    this.provider = provider || new MockSupportAdapter();
  }

  async createTicket(input: CreateTicketInput): Promise<SupportTicket> {
    const validated = CreateTicketInputSchema.parse(input);

    // 1. Spam / Rate Limiting (max 5 per 10 mins)
    this.checkRateLimit(validated.userId);

    // 2. Metadata sanitization
    const sanitizedMetadata = validated.browserMetadata
      ? {
          ...validated.browserMetadata,
          url: this.sanitizeUrl(validated.browserMetadata.url)
        }
      : undefined;

    // 3. Duplicate ticket detection
    const hash = createHash("sha256")
      .update(`${validated.tenantId}:${validated.userId}:${validated.subject}:${validated.description.trim()}`)
      .digest("hex");

    const duplicate = await this.repository.findRecentDuplicate(
      validated.tenantId,
      hash,
      5 * 60 * 1000 // 5 minutes window
    );

    if (duplicate) {
      return duplicate;
    }

    const ticket: SupportTicket = {
      id: `tkt_${Date.now()}_${randomUUID().substring(0, 6)}`,
      tenantId: validated.tenantId,
      userId: validated.userId,
      userEmail: validated.userEmail,
      type: validated.type,
      status: "CREATED",
      priority: "MEDIUM",
      subject: validated.subject,
      description: validated.description,
      browserMetadata: sanitizedMetadata,
      attachments: validated.attachments,
      contentHash: hash,
      isLegalHold: false,
      verifiedIdentity: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.repository.saveTicket(ticket);
  }

  async updateStatus(ticketId: string, newStatus: TicketStatus): Promise<SupportTicket> {
    const ticket = await this.repository.getTicket(ticketId);
    if (!ticket) throw new Error(`Ticket '${ticketId}' not found`);

    ticket.status = newStatus;

    if (newStatus === "FIRST_RESPONSE" && !ticket.firstResponseAt) {
      ticket.firstResponseAt = new Date();
    }
    if (newStatus === "RESOLVED") {
      ticket.resolvedAt = new Date();
    }

    return this.repository.saveTicket(ticket);
  }

  async setLegalHold(ticketId: string, isHold: boolean): Promise<SupportTicket> {
    const ticket = await this.repository.getTicket(ticketId);
    if (!ticket) throw new Error(`Ticket '${ticketId}' not found`);

    ticket.isLegalHold = isHold;
    return this.repository.saveTicket(ticket);
  }

  async createImpersonationSession(
    adminId: string,
    targetUserId: string,
    tenantId: string,
    reason: string,
    durationMinutes: number = 30
  ): Promise<ImpersonationSession> {
    if (!reason || reason.trim().length < 5) {
      throw new Error("Impersonation requires an explicit reason of at least 5 characters");
    }

    const session: ImpersonationSession = {
      id: `imp_${Date.now()}_${randomUUID().substring(0, 6)}`,
      adminId,
      targetUserId,
      tenantId,
      reason,
      expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000),
      createdAt: new Date(),
      revoked: false
    };

    return this.repository.saveImpersonationSession(session);
  }

  async listTickets(tenantId: string, status?: string): Promise<SupportTicket[]> {
    return this.repository.listTickets(tenantId, status);
  }

  private checkRateLimit(userId: string) {
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;
    const timestamps = (this.userRequestTimestamps.get(userId) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= 5) {
      throw new Error("Rate limit exceeded: You can only submit up to 5 support requests per 10 minutes");
    }

    timestamps.push(now);
    this.userRequestTimestamps.set(userId, timestamps);
  }

  private sanitizeUrl(rawUrl: string): string {
    try {
      const url = new URL(rawUrl);
      // Strip sensitive query params
      const sensitiveParams = ["token", "auth", "secret", "password", "key", "access_token"];
      sensitiveParams.forEach((param) => url.searchParams.delete(param));
      return url.toString();
    } catch {
      return rawUrl.split("?")[0]; // Fallback: strip query entirely
    }
  }
}
