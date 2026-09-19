export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface ProviderSendResult {
  provider: string;
  messageId: string;
  status: "SENT" | "DELIVERED" | "QUEUED";
}

export interface NotificationProvider {
  readonly name: string;
  sendEmail(message: EmailMessage): Promise<ProviderSendResult>;
}
