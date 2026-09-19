import type { SupportTicket, CreateTicketInput } from "../schemas/support-schemas.js";

export interface ISupportProvider {
  name: string;
  createTicket(input: CreateTicketInput): Promise<SupportTicket>;
  syncTicketStatus?(ticketId: string, status: string): Promise<void>;
}

export class MockSupportAdapter implements ISupportProvider {
  public name = "MOCK";
  private tickets: Map<string, SupportTicket> = new Map();

  async createTicket(input: CreateTicketInput): Promise<SupportTicket> {
    const ticket: SupportTicket = {
      id: `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...input,
      status: "CREATED",
      priority: "MEDIUM",
      isLegalHold: false,
      verifiedIdentity: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }
}
