import type {
  SupportTicket,
  CreateTicketInput,
  TicketStatus
} from "../schemas/support-schemas.js";

export interface SupportClientConfig {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  headers?: Record<string, string>;
}

export class SupportClient {
  private baseUrl: string;
  private fetchFn: typeof fetch;
  private headers: Record<string, string>;

  constructor(config: SupportClientConfig = {}) {
    this.baseUrl = config.baseUrl || "/api/support";
    this.fetchFn = config.fetchFn || (typeof fetch !== "undefined" ? fetch : (() => {}) as any);
    this.headers = config.headers || { "Content-Type": "application/json" };
  }

  async createTicket(input: CreateTicketInput): Promise<SupportTicket> {
    const res = await this.fetchFn(`${this.baseUrl}/tickets`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error(`Failed to submit support ticket: ${res.statusText}`);
    return res.json();
  }

  async listTickets(status?: string): Promise<SupportTicket[]> {
    const url = status ? `${this.baseUrl}/tickets?status=${status}` : `${this.baseUrl}/tickets`;
    const res = await this.fetchFn(url, {
      method: "GET",
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Failed to list support tickets: ${res.statusText}`);
    return res.json();
  }

  async updateTicketStatus(ticketId: string, status: TicketStatus): Promise<SupportTicket> {
    const res = await this.fetchFn(`${this.baseUrl}/tickets/${ticketId}/status`, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error(`Failed to update ticket status: ${res.statusText}`);
    return res.json();
  }
}
