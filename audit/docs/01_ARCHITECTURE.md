# 01 — Audit Logs & Activity Stream Architecture

## 1. Overview
The Audit module captures immutable, append-only chronological events across the application. Every sensitive action (auth, billing, role changes, flags, project mutations) generates an audit event.

## 2. Cryptographic Hash Chaining
- Each audit log entry includes a `hash` derived from SHA-256 of:
  `previousHash + id + tenantId + actor.id + action + target.id + timestamp`.
- This ensures that any modification or deletion of past entries breaks the chain and can be detected during verification.
