# 01 — Rate Limiting, Security & API Protection Architecture

## 1. System Overview
The Security module acts as a centralized, defense-in-depth API protection gateway. Every incoming HTTP request flows through a strict pipeline:
1. **Request Normalization**: Path normalization (collapsing redundant slashes, Unicode NFKC normalization) and header sanitization.
2. **Request Smuggling Detection**: Rejection of conflicting `Content-Length` and `Transfer-Encoding` payloads.
3. **IP Reputation & Abuse Check**: Immediate drop of actively blocked IP addresses.
4. **Rate Limiting**: Sliding window rate limits evaluated per endpoint scope (Login, Signup, API, AI, Uploads).
5. **SSRF Guard**: Strict destination filtering on any outbound URL fetch initiated by the server.
6. **Security Headers**: Injection of defensive HTTP response headers (CSP, HSTS, X-Content-Type-Options, Frame Options).

## 2. Rate Limiting Strategy
- **Algorithm**: Sliding Window Log, preventing burst-at-boundary exploits inherent to fixed window algorithms.
- **Granular Scopes**:
  - `LOGIN`: 5 attempts / 60s (with 5-minute progressive blocking).
  - `SIGNUP`: 3 attempts / 60s.
  - `PASSWORD_RESET`: 3 attempts / 300s.
  - `API_DEFAULT`: 100 requests / 60s.
  - `AI_GENERATE`: 10 requests / 60s.
  - `FILE_UPLOAD`: 20 requests / 60s.
