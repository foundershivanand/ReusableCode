# Module 83: Retry Safety & Idempotency

Prevents double-charging, duplicate orders, or double-spent AI credits:
- Mandates `Idempotency-Key` header on all mutating POST/PUT requests
- Returns cached response if idempotency key has already been processed
