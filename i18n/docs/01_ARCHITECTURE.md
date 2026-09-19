# Architecture: Multi-Language & i18n

## Overview
The i18n module provides a comprehensive internationalization framework supporting multiple languages, dynamic language switching, fallback hierarchies, pluralization, locale-aware number/currency/date formatting, and bidirectional (LTR/RTL) rendering.

## Core Features
1. **Locale Detection**: Multi-tier detection cascade: Query parameter (`?lang=`) -> Cookie (`locale=`) -> `Accept-Language` header -> Default system locale.
2. **Translation Fallback Hierarchy**: Hierarchical fallback resolves missing translations gracefully (e.g., `fr-CA` -> `fr` -> `en`).
3. **Pluralization**: Standardized plural categorization (`zero`, `one`, `two`, `few`, `many`, `other`) powered by `Intl.PluralRules`.
4. **Bidirectional Layouts (RTL)**: Automatic detection of right-to-left scripts (`ar`, `he`, `fa`, `ur`) setting `dir="rtl"` on DOM elements.
5. **Safe Interpolation**: Parameter substitution with automatic HTML/script escaping to eliminate XSS risks.
6. **Key Drift & Missing Translation Detection**: Automated comparison of locale dictionaries against canonical keys to detect missing or stale strings.
