# 02 — Onboarding Security & Authorization Model

## 1. Context-Aware Gating & IDOR Prevention
- Users can only fetch and update their own onboarding records: `tenant_id` and `user_id` are strictly validated on every mutation.
- Steps requiring elevated roles (e.g. `ADMIN`, `BILLING_MANAGER`) are dynamically filtered server-side so unauthorized users cannot view or trigger them.

## 2. Server-Side Completion Validation
- Critical onboarding steps that unlock capabilities (e.g., creating a workspace, connecting a custom domain) require server verification proofs.
- Clients cannot simply submit `status: COMPLETED` to bypass actual completion checks.
