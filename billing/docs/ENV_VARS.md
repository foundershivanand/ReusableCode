# Module 02: Environment Variables Matrix & Schema

```typescript
import { z } from "zod";

export const BillingEnvSchema = z.object({
  BILLING_PROVIDER: z.enum(["stripe", "paddle", "lemonsqueezy"]).default("stripe"),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
  
  // Paddle
  PADDLE_API_KEY: z.string().optional(),
  PADDLE_WEBHOOK_SECRET: z.string().optional(),
  
  // Lemon Squeezy
  LEMON_SQUEEZY_API_KEY: z.string().optional(),
  LEMON_SQUEEZY_WEBHOOK_SECRET: z.string().optional(),
});
```

| Variable | Required | Description | Example |
|---|---|---|---|
| `BILLING_PROVIDER` | Yes | Primary payment gateway | `stripe` |
| `STRIPE_SECRET_KEY` | If Stripe | Stripe secret key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | If Stripe | Webhook signing secret | `whsec_...` |
| `PADDLE_API_KEY` | If Paddle | Paddle API secret key | `pdl_...` |
| `PADDLE_WEBHOOK_SECRET` | If Paddle | Paddle webhook secret | `whsec_...` |
