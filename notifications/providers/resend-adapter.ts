import type { NotificationProvider, EmailMessage, ProviderSendResult } from "./notification-provider.js";

export class ResendAdapter implements NotificationProvider {
  public readonly name = "resend";

  constructor(
    private apiKey: string,
    public readonly defaultFrom: string = "noreply@example.com"
  ) {}

  async sendEmail(message: EmailMessage): Promise<ProviderSendResult> {
    if (!this.apiKey) {
      throw new Error("Resend API key is not configured");
    }

    const fromAddress = message.from || this.defaultFrom;
    const messageId = `resend_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      provider: `${this.name}:${fromAddress}`,
      messageId,
      status: "SENT"
    };
  }
}
