import type { NotificationProvider, EmailMessage, ProviderSendResult } from "./notification-provider.js";

export class AwsSesAdapter implements NotificationProvider {
  public readonly name = "aws-ses";

  constructor(
    public readonly region: string = "us-east-1",
    public readonly defaultFrom: string = "noreply@example.com"
  ) {}

  async sendEmail(message: EmailMessage): Promise<ProviderSendResult> {
    const fromAddress = message.from || this.defaultFrom;
    const messageId = `ses_${this.region}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      provider: `${this.name}:${fromAddress}`,
      messageId,
      status: "SENT"
    };
  }
}
