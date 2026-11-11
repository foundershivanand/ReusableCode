# Module 08: Environment System

Manages environment configuration across `.env.dev`, `.env.staging`, and `.env.prod`.
- Secrets are decrypted at runtime or injected via compile-time `--dart-define`
- Validates that mandatory keys are present before app execution
