# 08 — Security Monitoring & Incident Alarms

1. **Key Metrics**:
   - `rate_limit_exceeded_total`: Gauge of 429 responses segmented by scope.
   - `ssrf_blocks_total`: Count of blocked outbound URL fetch requests.
   - `request_smuggling_violations_total`: Count of protocol violation rejections.
2. **Alert Conditions**:
   - Critical: Any increment in `ssrf_blocks_total` targeting `169.254.169.254`.
   - High: Spike in `rate_limit_exceeded_total` on `LOGIN` or `PASSWORD_RESET` scopes.
