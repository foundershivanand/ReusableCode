# Module 12: Offline-First Architecture

Implements the **Outbox Pattern** for robust offline mobile operations:
- Queues write mutations when device is disconnected
- Dispatches transactions with UUIDv4 idempotency keys when connection restores
- Conflict resolution strategies: `lastWriteWins`, `serverAuthoritative`, `clientWins`
