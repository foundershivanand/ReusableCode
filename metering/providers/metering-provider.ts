import { PaymentProviderAdapter } from "../server/metering-service.js";

export class MockPaymentProviderAdapter implements PaymentProviderAdapter {
  private shouldFail = false;

  setShouldFail(fail: boolean) {
    this.shouldFail = fail;
  }

  async chargePaymentMethod(_params: {
    tenantId: string;
    paymentMethodId: string;
    amount: number;
    currency: string;
  }): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    if (this.shouldFail) {
      return { success: false, error: "Card declined" };
    }
    return {
      success: true,
      transactionId: `ch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
  }
}
