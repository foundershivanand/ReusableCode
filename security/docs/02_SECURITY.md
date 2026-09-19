# 02 — Server-Side Request Forgery (SSRF) & API Defense

## 1. SSRF Mitigations
Any server-side HTTP client fetching user-supplied URLs must pass validation through `validateSafeExternalUrl()`:
- **Protocol Restrictions**: Only `http:` and `https:` are permitted; `file:`, `gopher:`, `ftp:`, `data:` are blocked.
- **Private IP Rejection (RFC 1918)**:
  - `10.0.0.0/8`
  - `172.16.0.0/12`
  - `192.168.0.0/16`
- **Cloud Metadata & Loopback Rejection**:
  - `127.0.0.1`, `::1`, `localhost`
  - `169.254.169.254` (AWS, GCP, Azure, DigitalOcean instance metadata service)
  - `metadata.google.internal`, `instance-data`

## 2. Request Smuggling Defenses
- Requests containing both `Content-Length` and `Transfer-Encoding` headers are immediately rejected with `400 Bad Request` (`RequestSmugglingError`).
- Duplicate `Content-Length` headers with mismatched values are blocked.

## 3. Defensive Security Headers
- `Content-Security-Policy`: Disallows untrusted external scripts and embeds (`object-src 'none'`, `frame-ancestors 'none'`).
- `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload` enforces HTTPS for 2 years.
- `X-Frame-Options: DENY`: Complete clickjacking protection.
- `X-Content-Type-Options: nosniff`: Prevents MIME-confusion attacks.
