# API Reference: Metering & Credit System

## REST Endpoints

### GET `/api/metering/balance?tenantId={tenantId}`
Returns the current credit balance object (`CreditBalance`).

### GET `/api/metering/ledger?tenantId={tenantId}&limit={limit}`
Returns the most recent ledger transactions for the tenant.

### POST `/api/metering/ingest`
Ingests a usage event idempotently.
- Body: `MeterEventIngest`
- Returns: `{ processed: boolean, ledgerEntry: LedgerEntry, balance: CreditBalance }`

### POST `/api/metering/reserve`
Reserves credits for an upcoming operation.
- Body: `ReserveCreditsInput`
- Returns: `{ reservation: Reservation, remainingBalance: number }`

### POST `/api/metering/settle`
Settles a pending reservation with actual consumed credits.
- Body: `SettleCreditsInput`
- Returns: `{ reservation: Reservation, balance: CreditBalance, ledgerEntry: LedgerEntry }`

### POST `/api/metering/release`
Releases a pending reservation back to available credits.
- Body: `ReleaseCreditsInput`
- Returns: `{ reservation: Reservation, balance: CreditBalance, ledgerEntry: LedgerEntry }`

### PUT `/api/metering/auto-recharge`
Configures threshold and amount for automated recharge.
- Body: `AutoRechargeConfig`
- Returns: `AutoRechargeConfig`

### POST `/api/metering/admin/correction`
Admin adjustment of credit balances.
- Body: `AdminCorrectionInput`
- Returns: `{ balance: CreditBalance, ledgerEntry: LedgerEntry }`
