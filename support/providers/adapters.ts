import type { ISupportProvider } from "./support-provider.js";
import type { SupportTicket, CreateTicketInput } from "../schemas/support-schemas.js";

export class CrispSupportAdapter implements ISupportProvider {
  public name = "CRISP";
  constructor(private websiteId: string, private apiKey?: string) {}

  async createTicket(input: CreateTicketInput): Promise<SupportTicket> {
    return {
      id: `crisp_${Date.now()}`,
      ...input,
      status: "CREATED",
      priority: "MEDIUM",
      isLegalHold: false,
      verifiedIdentity: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

export class IntercomSupportAdapter implements ISupportProvider {
  public name = "INTERCOM";
  constructor(private appToken: string) {}

  async createTicket(input: CreateTicketInput): Promise<SupportTicket> {
    return {
      id: `intercom_${Date.now()}`,
      ...input,
      status: "CREATED",
      priority: "MEDIUM",
      isLegalHold: false,
      verifiedIdentity: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

export class PlainSupportAdapter implements ISupportProvider {
  public name = "PLAIN";
  constructor(private apiKey: string) {}

  async createTicket(input: CreateTicketInput): Promise<SupportTicket> {
    return {
      id: `plain_${Date.now()}`,
      ...input,
      status: "CREATED",
      priority: "MEDIUM",
      isLegalHold: false,
      verifiedIdentity: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
