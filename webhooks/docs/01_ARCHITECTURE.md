# 01 — Webhook Engine & Public API Key Management Architecture

## 1. Overview
The Webhooks & Public API module provides high-entropy API key lifecycle management, SSRF-protected webhook registration, and resilient HMAC-signed event deliveries.

## 2. API Key Storage & Hashing
- API keys are NEVER stored in plaintext.
- Upon generation, a non-secret prefix (`pk_live_xxxx`) is saved alongside a SHA-256 hash (`keyHash`).
- The plaintext key is shown exactly once to the user upon creation.
