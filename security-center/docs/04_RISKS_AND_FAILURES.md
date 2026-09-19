# Risks & Failures: Security Center & Compliance Dashboard

## Failure Modes & Mitigations
1. **False-Positive Fatigue**: Developers ignore security alerts due to noisy false positives.
   - *Mitigation*: Time-bounded suppression workflow requiring justification, owner, and explicit approval.
2. **Secret Leak Ignored**: Leak alert triggered, but secret remains active.
   - *Mitigation*: Automated revocation hook initiates secret invalidation immediately upon detection.
3. **Information Disclosure to Non-Admins**: Vulnerability findings exposed in public API response.
   - *Mitigation*: Strict RBAC middleware blocks non-admin requests with 403 Forbidden.
