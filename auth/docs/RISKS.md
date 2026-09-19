# Module 01: Remaining Risks & Residual Threat Analysis

> [!WARNING]
> No authentication system is "100% secure" or free of vulnerabilities. Security is a continuous process of risk minimization. The following residual risks remain and require operational safeguards.

---

## 1. Identified Residual Risks & Compensating Controls

### Risk 1: Phishing & Adversary-in-the-Middle (AiTM) Proxies
- **Description**: Reverse-proxy phishing kits (e.g., Evilginx) can intercept session cookies and TOTP codes in real-time between the user and the real server.
- **Severity**: HIGH
- **Compensating Controls**:
  - Implement WebAuthn / Passkeys (FIDO2) with origin-bound cryptographic credentials.
  - Device/IP anomaly detection to trigger reauthentication if session appears from an unexpected geographical location.

### Risk 2: Client-Side Malware / Keyloggers
- **Description**: If a user's local operating system or browser is infected with infostealer malware, keystrokes, clipboard data, and browser memory can be exfiltrated.
- **Severity**: HIGH
- **Compensating Controls**:
  - Short session inactivity timeouts (30 minutes).
  - Reauthentication required for high-risk operations (email change, password change, MFA removal).
  - Out-of-band email notifications on all security-critical changes.

### Risk 3: Distributed Credential Stuffing / Botnets
- **Description**: Large botnets utilizing rotating residential proxies can bypass naive IP-based rate limiting by distributing login attempts across millions of IPs.
- **Severity**: MEDIUM
- **Compensating Controls**:
  - Dual-layer rate limiting (IP + Account email throttling).
  - CAPTCHA / Cloudflare Turnstile integration on repeated failures.
  - Global password breach checks via HaveIBeenPwned k-anonymity API.

### Risk 4: Direct Database Server Breach
- **Description**: If an attacker gains raw read access to the database (e.g., via server compromise or unencrypted database backups), attacker has access to user records.
- **Severity**: HIGH
- **Compensating Controls**:
  - Passwords hashed using CPU/memory-intensive `scrypt` with individual salts.
  - Session tokens, verification tokens, and recovery codes stored strictly as SHA-256 hashes (raw tokens cannot be recovered from the DB).
  - Database encryption at rest and segregated network access (private VPC).
