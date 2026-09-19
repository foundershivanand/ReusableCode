# 04 — Security Risks & Failure Scenarios

1. **DNS Rebinding Attacks**:
   - Risk: Attacker registers a domain whose DNS initially resolves to a public IP, passes validation, and subsequently resolves to `127.0.0.1` upon request dispatch.
   - Mitigation: In production environments, use a custom HTTP agent that validates the resolved IP address immediately prior to socket connection.
2. **Wildcard CORS Misconfiguration**:
   - Risk: Setting `Access-Control-Allow-Origin: *` with credentials enabled leaks sensitive user sessions.
   - Mitigation: Strict whitelist matching against configured origins; wildcard `*` is prohibited when credentials are sent.
