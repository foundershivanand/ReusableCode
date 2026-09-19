# 02 — Data Portability Security & CSV Injection Defense

## 1. CSV Formula Injection Defense (DDE Attack)
- Untrusted data exported to CSV can execute arbitrary commands in Microsoft Excel / Google Sheets if starting with `=`, `+`, `-`, or `@`.
- The export engine sanitizes all output by prepending a single quote (`'`) to any field beginning with formula trigger characters.

## 2. Multi-Tenant Boundary Isolation
- Export queries strictly scope all data selections by `tenantId` and `userId` to prevent cross-tenant data exfiltration.
