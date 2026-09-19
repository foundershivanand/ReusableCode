# Security: Multi-Language & i18n

## Runtime Translation Safety
- Translation strings and variable interpolation are sanitized by default. Characters such as `<`, `>`, `"`, `'`, and `&` are HTML-escaped.
- Never render user-generated content or arbitrary translation keys as raw HTML (`dangerouslySetInnerHTML`) without strict sanitizer pipelines.

## Separation of Translated Strings from User Content
- System UI translation dictionaries are isolated from tenant-created dynamic content.
- Missing translation fallback returns the translation key safely without executing any dynamic code.
