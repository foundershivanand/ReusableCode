# API Reference: Multi-Language & i18n

## REST Endpoints

### GET `/api/i18n/locales`
Returns list of available system locales (`LocaleMetadata[]`).

### GET `/api/i18n/dictionary?locale={locale}&namespace={namespace}`
Returns the translation dictionary for the specified locale and namespace.

### GET `/api/i18n/missing-keys?locale={locale}&namespace={namespace}`
Returns missing and stale keys relative to the default locale (`MissingKeyReport`).
