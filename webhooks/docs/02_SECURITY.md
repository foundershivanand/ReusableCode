# 02 — Webhooks Security & SSRF Defense

## 1. SSRF Prevention
- Destination URLs are strictly validated to block private address ranges (e.g. `127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, and cloud metadata `169.254.169.254`).

## 2. HMAC Signatures & Replay Prevention
- Every outbound webhook includes a signature header: `X-Webhook-Signature: t={timestamp},v1={hmac_sha256}`.
- Consumers verify the signature using their shared secret and reject timestamps older than 5 minutes.
