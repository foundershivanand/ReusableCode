# Backup & Restore: Metering & Credit System

## Ledger Immutability & Reconciliation
- The `metering_ledger` table is append-only.
- A snapshot backup of `metering_balances`, `metering_credit_grants`, and `metering_ledger` allows complete balance reconciliation:
  $$\text{balance} = \sum \text{amount of all ledger entries for tenant}$$
- Periodic checksum reconciliations can be run to verify that `metering_balances.available_balance` matches the sum of ledger entries.
