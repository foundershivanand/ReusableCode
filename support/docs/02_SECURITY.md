# 02 — Customer Support Security & Impersonation

## 1. Metadata Sanitization
- Browser metadata, URLs, and user agents are sanitized before persistence.
- Sensitive query parameters (tokens, passwords, keys) are stripped to prevent credential leaks.

## 2. Support Impersonation Controls
- Impersonation requires explicit justification (`reason`) and is strictly time-limited (default 30 mins).
- Impersonated sessions can never view customer passwords or payment credentials.
