# 02 — Search Security & Snippet Sanitization

## 1. Zero-Leakage Search Snippets
- Snippets never display deleted, private, or metadata-only content.
- Search queries are capped at 200 characters to prevent ReDoS and wildcard amplification attacks.

## 2. Destructive Command Safeguards
- Commands marked `isDestructive: true` trigger a confirmation modal before execution.
