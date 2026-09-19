# Module 02: Production Deployment Checklist

Before deploying this billing module to production, complete each checklist item:

## 1. Provider & Gateway Configuration
- [ ] **Live API Keys**: Replace test keys with production live API keys in environment variables.
- [ ] **Webhook Endpoint Registration**: Register the live HTTPS webhook URL (e.g. `https://app.product.com/api/billing/webhook/stripe`) in the provider dashboard.
- [ ] **Webhook Secret**: Copy the signing secret (`whsec_...`) to `STRIPE_WEBHOOK_SECRET`.
- [ ] **Enabled Events**: Ensure the webhook subscription includes:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `charge.refunded`
  - `charge.dispute.created`

## 2. Security & Portal Controls
- [ ] **Raw Body Preservation**: Verify that the webhook endpoint has access to the raw unparsed request body for HMAC-SHA256 signature verification.
- [ ] **Portal Return URL**: Ensure `APP_URL` matches the approved domain in the payment gateway settings.
- [ ] **HTTPS Enforcement**: Webhooks and checkout redirects must only operate over HTTPS.
