# Module 61: Isolation Guardian

Enforces **Rule 61: The Most Important Factory Rule**:
```text
                  FACTORY
                     │
       ┌─────────────┼─────────────┐
       │             │             │
     App 1         App 2         App 3
       │             │             │
    Backend       Backend       Backend
       │             │             │
      DB             DB            DB

NOT:

                 GIANT BACKEND
                      │
        ┌─────────────┼──────────────┐
        │             │              │
      App 1         App 2          App 100
```

## Security & Architectural Invariants
1. **Isolated Source Code**: Each app has its own self-contained directory under `apps/<app_id>`.
2. **Isolated Backend**: Each app has its own dedicated backend service (`apps/<app_id>/backend/`).
3. **Isolated Database**: No shared connection strings, credentials, or databases between products.
4. **Isolated Store Identity**: Independent Bundle IDs, Keystores, and Provisioning Profiles.
