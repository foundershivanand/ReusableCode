# 08 — File Storage Monitoring & Alerts

1. **Key Metrics**:
   - `storage_used_bytes`: Per-tenant and aggregate bucket consumption.
   - `malware_scans_rejected_total`: Count of malicious files intercepted.
   - `orphan_uploads_cleaned_total`: Count of abandoned upload allocations purged.
2. **Alert Conditions**:
   - High: Tenant storage reaches 90% of allocated quota.
   - Critical: Antivirus scanner detects active malicious binary or exploit attempt.
