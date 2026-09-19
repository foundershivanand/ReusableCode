# Security: Maintenance Mode, Status & System Banners

## Emergency Bypass Protection
- Bypass tokens are verified using `crypto.timingSafeEqual` over SHA-256 digests to prevent timing attacks.
- Client-controlled flags (e.g. `?bypass=true`) are strictly forbidden.
- Admin bypass is only permitted for authenticated sessions with explicit admin roles or verified secret tokens.

## Information Disclosure Prevention
- Internal stack traces, database error messages, or internal infrastructure details are never leaked in public maintenance messages.
- Internal incident tickets are kept distinct from the public customer-facing message.
