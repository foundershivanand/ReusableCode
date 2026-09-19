# 02 — Notification Security & Delivery Guarantees

## 1. Template Safety & Injection Defenses
- **HTML Escaping**: All user-supplied variables passed into templates (e.g. `name`, `appName`, `invoiceNumber`) undergo strict HTML escaping (`escapeHtml`) to prevent cross-site scripting (XSS) in email clients.
- **Template Injection Prevention**: Templates are predefined typed code functions rather than arbitrary user-controlled template strings evaluated at runtime.
- **Safe URL Validation**: All action links (magic links, verification URLs, password resets) are validated through `validateSafeUrl()`, rejecting `javascript:`, `data:`, or malformed protocols.

## 2. Sensitive Link Protection
Sensitive authentication and transaction URLs:
- Carry time-bound expirations (e.g. 15 minutes for magic links, 1 hour for password reset, 24 hours for email verification).
- Are single-use with cryptographic token hashing (SHA-256).
- Never expose plaintext passwords or sensitive customer secrets in query parameters.

## 3. Unsubscribe Semantics & Compliance
The engine enforces strict category boundaries:
- `MARKETING`: Unsubscribing is strictly respected.
- `TRANSACTIONAL`: User can configure channel preferences (email vs in-app).
- `SECURITY` & `LEGAL`: Cannot be disabled! Password resets, security breach notices, and legal disclosures are delivered unconditionally to ensure compliance.

## 4. Bounce Management & Suppression
- Hard bounces and spam complaints automatically record a `SuppressionRecord`.
- Subsequent send attempts to suppressed addresses are blocked before calling downstream providers, protecting sender reputation and IP deliverability.
