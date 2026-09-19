# 04 — Admin Risks & Mitigation

1. **Admin Credential Theft**:
   - Risk: Attacker obtains admin credentials and attempts mass deletion.
   - Mitigation: Mandatory MFA, short 15-minute inactivity timeouts, and required typed confirmation for destructive actions.
2. **Untracked Operational Changes**:
   - Risk: An admin alters customer configuration or issues refunds without documentation.
   - Mitigation: `executeAction()` requires an audit log with reason, IP, and user-agent before the mutation is committed.
