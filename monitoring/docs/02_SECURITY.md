# Security: Product Health, Monitoring & Incident System

## Public Status Sanitization
- The public status endpoint (`/api/monitoring/health?public=true`) strips all internal IP addresses, database hostnames, error traces, and credentials.
- Public status messages report high-level component availability (e.g. "Operational" vs "Degraded").

## Privacy & Redaction
- Log payloads and incident updates are sanitized to ensure no authorization tokens, passwords, or PII are exposed in monitoring alerts.
