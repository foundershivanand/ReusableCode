# Security: Experimentation & A/B Testing

## Authorization Independence
- Experiments must **NEVER** override security permissions or authorization gates.
- Do NOT use experimentation to determine whether a user has access to sensitive features or administrative roles.

## Privacy & Client Protection
- Do not expose internal experiment names, variant parameters, or allocation ratios unnecessarily to public client code where sensitive feature roadmaps could be leaked.
- Conversion tracking records user IDs safely without collecting unnecessary PII.
