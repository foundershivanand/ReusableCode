# Risks & Failures: Multi-Language & i18n

## Potential Failure Modes
1. **Text Expansion**: UI elements overflowing in languages with long compound words (e.g. German, Finnish).
   - *Mitigation*: CSS flex/grid layout rules with text wrapping (`word-break: break-word`) and adaptive container sizing.
2. **Missing Translation Keys**: User sees untranslated keys (e.g. `billing.invoice.pay_now`).
   - *Mitigation*: Automatic fallback to base language and default language (`en`), with missing key logging to database/monitoring.
3. **Locale Confusion in Server-Side Rendering (SSR)**: Mismatch between server-detected locale and client cookie.
   - *Mitigation*: Ensure locale detection middleware sets both response header and HTTP-only cookie.
