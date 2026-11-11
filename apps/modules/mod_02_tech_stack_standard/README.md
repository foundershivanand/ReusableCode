# Module 02: Tech Stack Standard

Enforces zero-tolerance architecture rules and Dart linter configurations for all apps in the factory.

## Strict Rules
1. **Zero Dynamic/Raw Types**: `strict-casts`, `strict-inference`, and `strict-raw-types` are mandatory.
2. **No Raw Prints**: `avoid_print` is set to `error`. All logging must route through `mod_25_crash_monitoring` or secure logger.
3. **Unawaited Futures**: All asynchronous calls must be explicitly awaited or safely unawaited.
4. **Build Context Safety**: Direct usage of `BuildContext` across async gaps without `mounted` check triggers a compile error.
