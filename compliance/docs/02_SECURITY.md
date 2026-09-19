# 02 — Legal & Compliance Security & Legal Hold

## 1. Legal Hold Protection
- When an account or workspace is flagged with `isUnderLegalHold = true`, data deletion and automated retention purge routines are strictly prevented.
- Deletion DSRs are marked as `HELD_UNDER_LEGAL_HOLD` with clear audit trails.

## 2. Two-Factor Identity Verification for DSRs
- Data export and deletion requests require email confirmation or identity verification tokens before processing to prevent malicious impersonation.
