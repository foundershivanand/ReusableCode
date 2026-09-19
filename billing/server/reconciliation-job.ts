import { BillingRepository } from "./repository.js";

export interface ProviderSubscriptionState {
  customerId: string;
  providerSubscriptionId: string;
  status: string;
  planId: string;
  currentPeriodEnd: Date;
}

export interface DriftRecord {
  customerId: string;
  field: string;
  internalValue: any;
  providerValue: any;
  resolved: boolean;
}

export interface ProviderReconciliationClient {
  fetchActiveSubscriptions(): Promise<ProviderSubscriptionState[]>;
}

export class FinancialReconciliationJob {
  private repo: BillingRepository;
  private providerClient: ProviderReconciliationClient;

  constructor(repo: BillingRepository, providerClient: ProviderReconciliationClient) {
    this.repo = repo;
    this.providerClient = providerClient;
  }

  /**
   * Compares internal subscriptions against provider subscriptions to detect drift
   */
  async runReconciliation(): Promise<{
    checkedCount: number;
    driftCount: number;
    drifts: DriftRecord[];
  }> {
    const providerSubs = await this.providerClient.fetchActiveSubscriptions();
    const drifts: DriftRecord[] = [];

    for (const pSub of providerSubs) {
      const internalSub = await this.repo.findActiveSubscriptionByCustomerId(pSub.customerId);

      if (!internalSub) {
        drifts.push({
          customerId: pSub.customerId,
          field: "subscription_exists",
          internalValue: null,
          providerValue: pSub.status,
          resolved: false,
        });
        continue;
      }

      // Check status drift
      if (internalSub.status !== pSub.status.toUpperCase()) {
        drifts.push({
          customerId: pSub.customerId,
          field: "status",
          internalValue: internalSub.status,
          providerValue: pSub.status.toUpperCase(),
          resolved: false,
        });

        // Reconcile status to match provider source of truth
        await this.repo.updateSubscription(internalSub.id, {
          status: pSub.status.toUpperCase() as any,
        });
      }

      // Check plan drift
      if (internalSub.planId !== pSub.planId) {
        drifts.push({
          customerId: pSub.customerId,
          field: "planId",
          internalValue: internalSub.planId,
          providerValue: pSub.planId,
          resolved: false,
        });

        await this.repo.updateSubscription(internalSub.id, {
          planId: pSub.planId,
        });
      }
    }

    return {
      checkedCount: providerSubs.length,
      driftCount: drifts.length,
      drifts,
    };
  }
}
