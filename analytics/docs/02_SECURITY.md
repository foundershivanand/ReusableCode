# 02 — Analytics Security & PII Redaction

## 1. PII Redaction & Secret Stripping
All event properties and log contexts pass through `redactSensitiveData()` before persistence or transmission. Keys matching any of the following patterns (case-insensitive) are automatically replaced with `[REDACTED]`:
- `password`
- `token`, `secret`, `authorization`
- `apikey`, `api_key`
- `creditcard`, `cardnumber`, `cvv`
- `ssn`, `cookie`

## 2. Consent-Aware Ingestion
Under GDPR and CCPA regulations, analytics tracking cannot occur without affirmative consent. If `consentGiven === false`, the event is dropped silently at the boundary before processing.
