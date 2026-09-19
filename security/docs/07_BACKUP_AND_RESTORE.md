# 07 — Security Backup & Incident Log Retention

1. **Blocked IP Persistence**:
   - `blocked_ips` records should be preserved across deployments to maintain active bans against ongoing brute-force campaigns.
2. **Security Events Archiving**:
   - `security_events` (SSRF attempts, smuggling errors) should be forwarded to a SIEM (e.g. AWS CloudWatch / Datadog / Splunk) for forensic investigation.
