# 02 — Admin Security & Defense-in-Depth

## 1. Break-Glass Administration
During critical outages or security incidents:
- Super Admins can activate emergency Break-Glass access with an explicit, mandatory justification.
- Break-glass access has a strictly enforced duration (e.g. 15 to 120 minutes max).
- Every break-glass activation is logged to `admin_audit_logs` and broadcasts an immediate alert to the engineering team.

## 2. Safe User Impersonation
- **Explicit Initiation**: Impersonation requires an active `SUPPORT_ADMIN` or `SUPER_ADMIN` role and a documented support ticket or customer authorization reason.
- **Visual Indicator**: The UI displays a persistent, sticky `<ImpersonationBanner />` showing who is being impersonated, remaining duration, and an instant "Exit Impersonation" action.
- **Secret Protection**: Passwords, 2FA recovery codes, and payment card details are never exposed to the impersonating admin.

## 3. Destructive Action Protection
High-risk operations (`USER_DELETE`, `ORGANIZATION_DELETE`, `PAYMENT_REFUND`) require:
1. Role authorization (`SUPER_ADMIN` or `BILLING_ADMIN`).
2. Exact typed confirmation phrase (e.g. "DELETE USER").
3. Mandatory audit reason explaining the business justification.
