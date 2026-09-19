# Monitoring & Alerts: Multi-Language & i18n

## Metrics
- `i18n.missing_key_requests_total`: Counter for missing translation key lookups.
- `i18n.locale_switches_total`: Counter for user-initiated language switches.

## Alerts
- `MissingTranslationSpike`: Alert when missing key requests exceed 50 per hour, indicating a broken deployment or untranslated feature.
