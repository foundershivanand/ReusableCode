# Security: Changelog, Roadmap & What's New

## Markdown Sanitization & XSS Prevention
- All markdown content submitted by authors is parsed and stripped of executable tags (`<script>`, `<iframe>`, `<object>`, `<embed>`, `javascript:` hrefs).
- Pre-publication validation rejects broken or malformed URLs to prevent phishing or broken asset references.

## Role-Based Publishing Controls
- Normal contributors can create `DRAFT` or submit for `REVIEW`.
- Only verified `publisher` and `admin` roles can trigger public disclosure (`PUBLISHED`).
- Target audiences (e.g. `INTERNAL_ONLY`) are enforced server-side before returning content to client queries.
