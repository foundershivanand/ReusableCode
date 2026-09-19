# 06 — Notification Environment Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `EMAIL_PROVIDER_PRIMARY` | String | `resend` | Primary email provider (`resend`, `sendgrid`, `aws-ses`) |
| `EMAIL_PROVIDER_FALLBACK` | String | `aws-ses` | Fallback email provider |
| `RESEND_API_KEY` | String | - | API key for Resend |
| `SENDGRID_API_KEY` | String | - | API key for SendGrid |
| `AWS_SES_REGION` | String | `us-east-1` | AWS SES Region |
| `DEFAULT_FROM_EMAIL` | String | `noreply@example.com` | Default sender address |
| `MAX_NOTIFICATION_ATTEMPTS` | Integer | `3` | Maximum retry attempts before marking as FAILED |
