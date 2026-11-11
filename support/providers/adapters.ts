import type { ISupportProvider } from "./support-provider.js";
import type { SupportTicket, CreateTicketInput } from "../schemas/support-schemas.js";

export class CrispSupportAdapter implements ISupportProvider {
  public name = "CRISP";
  constructor(public websiteId: string, public apiKey?: string) {}

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
  constructor(public appToken: string) {}

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
  constructor(public apiKey: string) {}

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
