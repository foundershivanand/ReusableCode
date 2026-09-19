# 02 — Settings Security & Privacy Enforcement

## 1. Sensitive Settings Protection
Changes to security-sensitive or identity-critical fields:
- Email address changes
- Password resets / changes
- 2FA / MFA enablement or disablement
- API credentials & webhook secrets
- Organization ownership transfers
Must not be treated with the same trust level as updating a theme. They require active session verification and recent reauthentication (`ReauthenticationRequiredError`).

## 2. Granular Privacy & Consent
In strict compliance with GDPR and CCPA, privacy choices are partitioned:
- `functionalConsent`: Essential system cookies and authentication tokens.
- `analyticsConsent`: Explicit opt-in for product telemetry and user interaction tracking.
- `marketingConsent`: Opt-in for promotional email campaigns and third-party advertising pixels.
- `personalizationConsent`: Opt-in for behavioral recommendation features.
Telemetry collectors must query `privacy.analyticsConsent` before transmitting events.
