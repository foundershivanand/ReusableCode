# Module 82: Circuit Breaker Module

Prevents cascading outages when external providers fail (OpenAI, Stripe, Firebase):
- States: `CLOSED` (Normal), `OPEN` (Tripped - fast fail), `HALF_OPEN` (Trial recovery)
