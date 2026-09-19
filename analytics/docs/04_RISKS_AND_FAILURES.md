# 04 — Analytics Risks & Mitigation

1. **High-Cardinality Label Explosion**:
   - Risk: Random user strings or UUIDs inserted as metric labels can exhaust memory in Prometheus or Datadog.
   - Mitigation: Strict validation of event names against predefined versions and schemas.
2. **Accidental PII Ingestion**:
   - Risk: Developer accidentally logs user email, password, or auth token in query parameters.
   - Mitigation: Recursive `redactSensitiveData()` ensures passwords and bearer tokens are masked before hitting disks or remote providers.
