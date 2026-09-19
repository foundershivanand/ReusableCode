# Security: Custom Domain & White-Label Engine

## Host-Header Attack Prevention
- Incoming `Host` or `X-Forwarded-Host` headers are strictly validated using RFC 1123 compliant domain regex.
- Ports, colons, null bytes, CRLF delimiters, and path characters are rejected with an error.

## Domain Takeover & Replay Prevention
- Ownership challenges utilize high-entropy random tokens (`verify_<hex32>`).
- Cross-tenant domain claiming is blocked if a domain is already registered.
- Removing a domain immediately clears routing tables and purges application caches to prevent dangling CNAME takeovers.
