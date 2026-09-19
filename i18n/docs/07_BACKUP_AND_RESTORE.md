# Backup & Restore: Multi-Language & i18n

## Dictionaries & Locales
- Table `i18n_locales` and `i18n_dictionaries` should be backed up regularly.
- Translation dictionaries are also versioned in code repository `/locales/*.json` to ensure releases can be restored even without a database.
