# Module 02: Remaining Risks & Residual Financial Threat Analysis

> [!WARNING]
> No billing module is immune to external provider disruptions or financial fraud. The following residual risks remain and require operational monitoring.

---

## 1. Identified Residual Risks & Compensating Controls

### Risk 1: Payment Provider Outage (e.g. Stripe API Down)
- **Severity**: HIGH
- **Impact**: Checkout sessions cannot be initiated; webhooks delayed.
- **Compensating Controls**:
  - `EntitlementResolver` maintains access for existing users during temporary provider outages.
  - Webhooks are queued and retried with exponential backoff by the provider.

### Risk 2: Friendly Fraud & Chargeback Disputes
- **Severity**: MEDIUM
- **Impact**: Chargeback fees and potential payment processor penalties if dispute rate exceeds 0.75%.
- **Compensating Controls**:
  - Automated dispute tracking via `charge.dispute.created` webhook.
  - Immediate notification to admins to upload evidence before deadline.

### Risk 3: Delayed Webhook Delivery Causing Temporary Entitlement Desync
- **Severity**: MEDIUM
- **Impact**: User completes payment but webhooks are delayed by 5-10 minutes.
- **Compensating Controls**:
  - Immediate synchronous checkout redirect handler validates session ID and creates tentative active entitlement before webhook arrives.
  - `FinancialReconciliationJob` catches and fixes drift.
