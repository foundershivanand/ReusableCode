# 02 — SEO Security & Host Header Poisoning Defense

## 1. Host Header Poisoning Prevention
- Canonical URLs and OpenGraph URLs are NEVER constructed blindly from raw HTTP `Host` headers.
- Incoming host headers are validated against a strict domain allowlist (`trustedDomains`). Untrusted headers automatically fallback to the configured primary domain.

## 2. Private Route Protection & No-Index Enforcement
- Routes matching `/admin`, `/dashboard`, `/settings`, `/account`, or marked `isPrivate: true` are strictly rendered with `noindex, nofollow`.
- Staging and preview environments automatically inject `X-Robots-Tag: noindex, nofollow`.
