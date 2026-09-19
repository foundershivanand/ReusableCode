# Architecture: Metering & Credit System

## Overview
The Metering module provides a double-entry, transaction-safe usage and credit ledger. It is designed for consumption-based pricing models, API metering, and prepaid/postpaid credit balances.

## Core Concepts
1. **Credit Balance**: Real-time snapshot of available, reserved, and lifetime credits. Concurrency is managed via optimistic locking (`version` column) and mutex locks per tenant.
2. **Credit Grants & Expiration**: Credits are granted with optional expiration dates and consumption priorities. Grants with earlier expiration dates are prioritized during consumption.
3. **Reservation Model (Reserve -> Execute -> Settle)**:
   - For long-running or expensive operations (e.g., AI generation, batch jobs), credits are reserved prior to execution.
   - Upon completion, the reservation is settled for the actual consumed quantity.
   - If the operation fails, the reservation is released, returning credits back to available balance.
4. **Idempotency**: All metering event ingestion and credit adjustments support idempotency keys to prevent duplicate billing from network retries.
5. **Auto-Recharge**: Threshold-based automated credit balance replenishments with monthly maximum safeguards.
6. **Admin Corrections**: Non-destructive, fully audited balance corrections requiring explicit justifications.
