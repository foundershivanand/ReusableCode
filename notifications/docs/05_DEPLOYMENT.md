# 05 — Notification Deployment & DNS Setup

1. **DNS Deliverability Configuration**:
   - **SPF (Sender Policy Framework)**: `v=spf1 include:sendgrid.net include:resend.com ~all`
   - **DKIM (DomainKeys Identified Mail)**: Add CNAME records provided by your active email provider.
   - **DMARC**: `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@yourdomain.com`
2. **Webhook Ingestion Setup**:
   - Register webhook endpoints (`/api/notifications/webhooks/resend` or `/sendgrid`) with signature verification to receive bounce and spam notifications.
