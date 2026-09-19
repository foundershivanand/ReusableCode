# 02 — Audit Security & Secret Scrubbing

## 1. Secret Scrubbing
- All payloads (`beforeState`, `afterState`, `metadata`) pass through an automated secret filter before persistence.
- Keys matching `password`, `token`, `secret`, `apiKey`, `creditCard`, `cvv`, etc., are automatically replaced with `[REDACTED]`.

## 2. Delegation & Impersonation Accountability
- If an admin acts on behalf of a user, `actor.impersonator` explicitly records the admin's identity, preventing actions from being falsely attributed to the user.
