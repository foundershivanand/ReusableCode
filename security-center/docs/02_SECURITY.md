# Security: Security Center & Compliance Dashboard

## Access Control & Privilege
- The Security Center is **strictly admin-only**. Ordinary users, guests, or low-privilege team members must never be allowed access to vulnerability findings or security audit logs.
- API endpoints require verified administrative bearer tokens or session roles (`admin`, `security_officer`).

## Secret Masking in Audit Logs
- When a secret leak is detected, the raw secret value is NEVER written to the database or event log; only its location, fingerprint, and secret type are recorded.
