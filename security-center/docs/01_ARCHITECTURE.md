# Architecture: Security Center & Compliance Dashboard

## Overview
The Security Center module provides automated security audits, finding lifecycle tracking, false-positive suppression, security incident correlation, and security posture scoring.

## Core Capabilities
1. **Automated Security Configuration Audits**:
   - Checks security headers (`Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options`).
   - Checks cookie security flags (`HttpOnly`, `Secure`, `SameSite`).
   - Checks CORS wildcards with credentials.
   - Checks environment configuration (detects production debug mode and weak secrets < 32 chars).
2. **Deduplication & Finding Lifecycle**:
   - Every vulnerability computes a unique fingerprint (e.g. `HEADERS:missing_hsts`).
   - Lifecycle states: `OPEN` -> `ACKNOWLEDGED` -> `IN_PROGRESS` -> `MITIGATED` -> `VERIFIED` -> `CLOSED`.
3. **False-Positive Suppression**:
   - Requires explicit justification reason (min 10 chars), owner, expiration date, and approver.
4. **Secret Leak Response Pipeline**:
   - `detect` -> `alert` -> `revoke` -> `rotate` -> `investigate`.
5. **Security Incident Correlation**:
   - Correlates brute-force failed logins followed by privileged administrative actions from the same IP/actor.
6. **Technical vs Legal Compliance**:
   - The module identifies technical configuration posture without falsely claiming legal or regulatory certifications automatically.
