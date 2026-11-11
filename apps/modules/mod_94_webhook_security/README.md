# Module 94: Webhook Security Module

Hardens webhook receivers (Stripe, RevenueCat, Firebase):
- HMAC SHA-256 signature verification
- Max timestamp drift: 300 seconds
- Webhook idempotency ledger
