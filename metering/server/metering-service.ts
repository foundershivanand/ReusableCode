import { randomUUID } from "node:crypto";
import {
  CreditBalance,
  CreditGrant,
  LedgerEntry,
  Reservation,
  MeterEventIngest,
  ReserveCreditsInput,
  SettleCreditsInput,
  ReleaseCreditsInput,
  AdminCorrectionInput,
  AutoRechargeConfig,
} from "../schemas/metering-schemas.js";
import { MeteringRepository } from "./repository.js";

export interface PaymentProviderAdapter {
  chargePaymentMethod(params: {
    tenantId: string;
    paymentMethodId: string;
    amount: number;
    currency: string;
  }): Promise<{ success: boolean; transactionId?: string; error?: string }>;
}

export class MeteringService {
  private locks = new Map<string, Promise<void>>();

  constructor(
    private repository: MeteringRepository,
    private paymentProvider?: PaymentProviderAdapter
  ) {}

  private async withTenantLock<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
    while (this.locks.has(tenantId)) {
      await this.locks.get(tenantId);
    }

    let resolveLock!: () => void;
    const lockPromise = new Promise<void>((res) => {
      resolveLock = res;
    });
    this.locks.set(tenantId, lockPromise);

    try {
      return await fn();
    } finally {
      this.locks.delete(tenantId);
      resolveLock();
    }
  }

  async getOrCreateBalance(tenantId: string): Promise<CreditBalance> {
    let balance = await this.repository.getBalance(tenantId);
    if (!balance) {
      balance = {
        tenantId,
        availableBalance: 0,
        reservedBalance: 0,
        lifetimePurchased: 0,
        lifetimeConsumed: 0,
        currency: "CREDITS",
        version: 0,
        updatedAt: new Date().toISOString(),
      };
      await this.repository.saveBalance(balance);
    }
    return balance;
  }

  async grantCredits(params: {
    tenantId: string;
    amount: number;
    expiresAt?: string | null;
    priority?: number;
    reason: string;
    idempotencyKey?: string;
  }): Promise<{ grant: CreditGrant; balance: CreditBalance; ledgerEntry: LedgerEntry }> {
    if (params.amount <= 0) {
      throw new Error("Credit grant amount must be positive");
    }

    return this.withTenantLock(params.tenantId, async () => {
      if (params.idempotencyKey) {
        const existing = await this.repository.getLedgerEntryByIdempotencyKey(
          params.idempotencyKey
        );
        if (existing) {
          const bal = (await this.repository.getBalance(params.tenantId))!;
          const grants = await this.repository.getActiveGrants(params.tenantId);
          return { grant: grants[0], balance: bal, ledgerEntry: existing };
        }
      }

      const balance = await this.getOrCreateBalance(params.tenantId);
      const grantId = randomUUID();
      const grant: CreditGrant = {
        id: grantId,
        tenantId: params.tenantId,
        amount: params.amount,
        remainingAmount: params.amount,
        expiresAt: params.expiresAt || null,
        priority: params.priority ?? 0,
        createdAt: new Date().toISOString(),
      };
      await this.repository.createCreditGrant(grant);

      balance.availableBalance += params.amount;
      balance.lifetimePurchased += params.amount;
      balance.version += 1;
      balance.updatedAt = new Date().toISOString();
      await this.repository.saveBalance(balance);

      const ledgerEntry: LedgerEntry = {
        id: randomUUID(),
        tenantId: params.tenantId,
        entryType: "CREDIT_PURCHASE",
        amount: params.amount,
        balanceAfter: balance.availableBalance,
        idempotencyKey: params.idempotencyKey,
        pricingVersion: "v1",
        reason: params.reason,
        metadata: { grantId },
        createdAt: new Date().toISOString(),
      };
      await this.repository.appendLedgerEntry(ledgerEntry);

      return { grant, balance, ledgerEntry };
    });
  }

  async reserveCredits(
    input: ReserveCreditsInput
  ): Promise<{ reservation: Reservation; remainingBalance: number }> {
    return this.withTenantLock(input.tenantId, async () => {
      const balance = await this.getOrCreateBalance(input.tenantId);

      // Expire any eligible credits before checking reservation capacity
      await this.expireCreditsInternal(input.tenantId, balance);

      if (balance.availableBalance < input.estimatedAmount) {
        throw new Error(
          `Insufficient credits: available ${balance.availableBalance}, required ${input.estimatedAmount}`
        );
      }

      // Lock credits into reservation
      balance.availableBalance -= input.estimatedAmount;
      balance.reservedBalance += input.estimatedAmount;
      balance.version += 1;
      balance.updatedAt = new Date().toISOString();
      await this.repository.saveBalance(balance);

      const ttl = input.ttlSeconds ?? 300;
      const reservation: Reservation = {
        id: randomUUID(),
        tenantId: input.tenantId,
        operationId: input.operationId,
        estimatedAmount: input.estimatedAmount,
        status: "PENDING",
        expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
        metadata: input.metadata || {},
        createdAt: new Date().toISOString(),
      };
      await this.repository.createReservation(reservation);

      const ledgerEntry: LedgerEntry = {
        id: randomUUID(),
        tenantId: input.tenantId,
        entryType: "RESERVATION_HOLD",
        amount: -input.estimatedAmount,
        balanceAfter: balance.availableBalance,
        reservationId: reservation.id,
        pricingVersion: "v1",
        reason: `Reserved ${input.estimatedAmount} credits for operation ${input.operationId}`,
        metadata: input.metadata ?? {},
        createdAt: new Date().toISOString(),
      };
      await this.repository.appendLedgerEntry(ledgerEntry);

      return { reservation, remainingBalance: balance.availableBalance };
    });
  }

  async settleCredits(
    input: SettleCreditsInput
  ): Promise<{ reservation: Reservation; balance: CreditBalance; ledgerEntry: LedgerEntry }> {
    const res = await this.repository.getReservation(input.reservationId);
    if (!res) {
      throw new Error(`Reservation ${input.reservationId} not found`);
    }
    if (res.status !== "PENDING") {
      throw new Error(`Cannot settle reservation in ${res.status} state`);
    }

    return this.withTenantLock(res.tenantId, async () => {
      const balance = (await this.repository.getBalance(res.tenantId))!;

      // Release reserved balance
      balance.reservedBalance -= res.estimatedAmount;

      const diff = res.estimatedAmount - input.actualAmount;
      if (diff > 0) {
        // Actual cost was less than estimated: refund remainder to available
        balance.availableBalance += diff;
      } else if (diff < 0) {
        // Actual cost was higher than estimated: deduct excess from available
        balance.availableBalance += diff; // diff is negative
      }

      balance.lifetimeConsumed += input.actualAmount;
      balance.version += 1;
      balance.updatedAt = new Date().toISOString();
      await this.repository.saveBalance(balance);

      // Consume from active credit grants in priority order
      await this.consumeFromGrants(res.tenantId, input.actualAmount);

      res.actualAmount = input.actualAmount;
      res.status = "SETTLED";
      await this.repository.updateReservation(res);

      const ledgerEntry: LedgerEntry = {
        id: randomUUID(),
        tenantId: res.tenantId,
        entryType: "RESERVATION_SETTLE",
        amount: -input.actualAmount,
        balanceAfter: balance.availableBalance,
        reservationId: res.id,
        pricingVersion: input.pricingVersion ?? "v1",
        reason: `Settled reservation ${res.id} for ${input.actualAmount} credits (estimated ${res.estimatedAmount})`,
        metadata: input.metadata ?? {},
        createdAt: new Date().toISOString(),
      };
      await this.repository.appendLedgerEntry(ledgerEntry);

      // Trigger auto-recharge check if applicable
      await this.checkAndTriggerAutoRecharge(res.tenantId, balance);

      return { reservation: res, balance, ledgerEntry };
    });
  }

  async releaseCredits(
    input: ReleaseCreditsInput
  ): Promise<{ reservation: Reservation; balance: CreditBalance; ledgerEntry: LedgerEntry }> {
    const res = await this.repository.getReservation(input.reservationId);
    if (!res) {
      throw new Error(`Reservation ${input.reservationId} not found`);
    }
    if (res.status !== "PENDING") {
      throw new Error(`Cannot release reservation in ${res.status} state`);
    }

    return this.withTenantLock(res.tenantId, async () => {
      const balance = (await this.repository.getBalance(res.tenantId))!;

      // Return reserved credits back to available balance
      balance.reservedBalance -= res.estimatedAmount;
      balance.availableBalance += res.estimatedAmount;
      balance.version += 1;
      balance.updatedAt = new Date().toISOString();
      await this.repository.saveBalance(balance);

      res.status = "RELEASED";
      await this.repository.updateReservation(res);

      const ledgerEntry: LedgerEntry = {
        id: randomUUID(),
        tenantId: res.tenantId,
        entryType: "RESERVATION_RELEASE",
        amount: res.estimatedAmount,
        balanceAfter: balance.availableBalance,
        reservationId: res.id,
        pricingVersion: "v1",
        reason: input.reason ?? "Operation cancelled or failed",
        metadata: {},
        createdAt: new Date().toISOString(),
      };
      await this.repository.appendLedgerEntry(ledgerEntry);

      return { reservation: res, balance, ledgerEntry };
    });
  }

  async ingestUsageEvent(
    event: MeterEventIngest
  ): Promise<{ processed: boolean; ledgerEntry: LedgerEntry; balance: CreditBalance }> {
    return this.withTenantLock(event.tenantId, async () => {
      const isNew = await this.repository.recordUsageEvent(event);
      if (!isNew) {
        // Idempotent duplicate
        const existingLedger = await this.repository.getLedgerEntryByIdempotencyKey(
          event.idempotencyKey
        );
        const balance = (await this.repository.getBalance(event.tenantId))!;
        return {
          processed: false,
          ledgerEntry: existingLedger!,
          balance,
        };
      }

      const balance = await this.getOrCreateBalance(event.tenantId);
      await this.expireCreditsInternal(event.tenantId, balance);

      const unitCost = event.unitCostCredits ?? 1;
      const totalCost = event.quantity * unitCost;
      balance.availableBalance -= totalCost;
      balance.lifetimeConsumed += totalCost;
      balance.version += 1;
      balance.updatedAt = new Date().toISOString();
      await this.repository.saveBalance(balance);

      await this.consumeFromGrants(event.tenantId, totalCost);

      const ledgerEntry: LedgerEntry = {
        id: randomUUID(),
        tenantId: event.tenantId,
        entryType: "USAGE_DEBIT",
        amount: -totalCost,
        balanceAfter: balance.availableBalance,
        idempotencyKey: event.idempotencyKey,
        pricingVersion: event.pricingVersion ?? "v1",
        reason: `Usage: ${event.eventType} (qty: ${event.quantity} @ ${unitCost})`,
        metadata: event.metadata ?? {},
        createdAt: new Date().toISOString(),
      };
      await this.repository.appendLedgerEntry(ledgerEntry);

      await this.checkAndTriggerAutoRecharge(event.tenantId, balance);

      return { processed: true, ledgerEntry, balance };
    });
  }

  async adminCorrection(
    input: AdminCorrectionInput
  ): Promise<{ balance: CreditBalance; ledgerEntry: LedgerEntry }> {
    if (!input.reason || input.reason.trim().length < 5) {
      throw new Error("Admin correction requires a detailed reason (at least 5 characters)");
    }
    if (!input.adminUserId) {
      throw new Error("Admin correction requires adminUserId");
    }

    return this.withTenantLock(input.tenantId, async () => {
      const balance = await this.getOrCreateBalance(input.tenantId);
      balance.availableBalance += input.amount;
      balance.version += 1;
      balance.updatedAt = new Date().toISOString();
      await this.repository.saveBalance(balance);

      const ledgerEntry: LedgerEntry = {
        id: randomUUID(),
        tenantId: input.tenantId,
        entryType: "ADMIN_CORRECTION",
        amount: input.amount,
        balanceAfter: balance.availableBalance,
        pricingVersion: "v1",
        reason: `Admin correction by ${input.adminUserId}: ${input.reason}`,
        metadata: { adminUserId: input.adminUserId },
        createdAt: new Date().toISOString(),
      };
      await this.repository.appendLedgerEntry(ledgerEntry);

      return { balance, ledgerEntry };
    });
  }

  async expireCredits(tenantId: string): Promise<number> {
    return this.withTenantLock(tenantId, async () => {
      const balance = await this.getOrCreateBalance(tenantId);
      return this.expireCreditsInternal(tenantId, balance);
    });
  }

  private async expireCreditsInternal(
    tenantId: string,
    balance: CreditBalance
  ): Promise<number> {
    const grants = await this.repository.getActiveGrants(tenantId);
    const now = new Date();
    let totalExpired = 0;

    for (const grant of grants) {
      if (grant.expiresAt && new Date(grant.expiresAt) <= now && grant.remainingAmount > 0) {
        const expiredAmount = grant.remainingAmount;
        totalExpired += expiredAmount;
        grant.remainingAmount = 0;
        await this.repository.updateCreditGrant(grant);

        balance.availableBalance -= expiredAmount;
        balance.version += 1;
        balance.updatedAt = new Date().toISOString();

        const ledgerEntry: LedgerEntry = {
          id: randomUUID(),
          tenantId,
          entryType: "CREDIT_EXPIRATION",
          amount: -expiredAmount,
          balanceAfter: balance.availableBalance,
          pricingVersion: "v1",
          reason: `Credit grant ${grant.id} expired`,
          metadata: { grantId: grant.id, expiresAt: grant.expiresAt },
          createdAt: new Date().toISOString(),
        };
        await this.repository.appendLedgerEntry(ledgerEntry);
      }
    }

    if (totalExpired > 0) {
      await this.repository.saveBalance(balance);
    }

    return totalExpired;
  }

  private async consumeFromGrants(tenantId: string, amount: number): Promise<void> {
    const grants = await this.repository.getActiveGrants(tenantId);
    const now = new Date();
    let remainingToConsume = amount;

    for (const grant of grants) {
      if (remainingToConsume <= 0) break;
      if (grant.expiresAt && new Date(grant.expiresAt) <= now) continue;
      const consumed = Math.min(grant.remainingAmount, remainingToConsume);
      grant.remainingAmount -= consumed;
      remainingToConsume -= consumed;
      await this.repository.updateCreditGrant(grant);
    }
  }

  private async checkAndTriggerAutoRecharge(
    tenantId: string,
    balance: CreditBalance
  ): Promise<void> {
    const config = await this.repository.getAutoRechargeConfig(tenantId);
    if (!config || !config.enabled) return;

    if (
      balance.availableBalance <= config.thresholdBalance &&
      config.currentMonthlyCount < config.maxMonthlyRecharges
    ) {
      if (this.paymentProvider && config.paymentMethodId) {
        const chargeResult = await this.paymentProvider.chargePaymentMethod({
          tenantId,
          paymentMethodId: config.paymentMethodId,
          amount: config.rechargeAmount,
          currency: "USD",
        });

        if (!chargeResult.success) {
          return;
        }
      }

      balance.availableBalance += config.rechargeAmount;
      balance.lifetimePurchased += config.rechargeAmount;
      balance.version += 1;
      balance.updatedAt = new Date().toISOString();
      await this.repository.saveBalance(balance);

      config.currentMonthlyCount += 1;
      config.updatedAt = new Date().toISOString();
      await this.repository.saveAutoRechargeConfig(config);

      const ledgerEntry: LedgerEntry = {
        id: randomUUID(),
        tenantId,
        entryType: "AUTO_RECHARGE",
        amount: config.rechargeAmount,
        balanceAfter: balance.availableBalance,
        pricingVersion: "v1",
        reason: `Auto-recharge triggered (threshold: ${config.thresholdBalance}, recharge: ${config.rechargeAmount})`,
        metadata: { monthlyCount: config.currentMonthlyCount },
        createdAt: new Date().toISOString(),
      };
      await this.repository.appendLedgerEntry(ledgerEntry);
    }
  }

  async configureAutoRecharge(config: AutoRechargeConfig): Promise<AutoRechargeConfig> {
    await this.repository.saveAutoRechargeConfig(config);
    return config;
  }
}
