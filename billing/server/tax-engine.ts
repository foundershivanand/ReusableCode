import { Money } from "./money.js";

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string; // ISO 3166-1 alpha-2 (e.g. US, GB, DE, IN)
}

export interface TaxCalculationResult {
  taxRatePercent: number;
  taxAmount: Money;
  subtotal: Money;
  total: Money;
  isTaxExempt: boolean;
  taxJurisdiction: string;
}

export interface TaxProvider {
  calculateTax(params: {
    amount: Money;
    billingAddress?: BillingAddress;
    taxId?: string;
    isTaxInclusive: boolean;
  }): Promise<TaxCalculationResult>;
}

/**
 * Standard Tax Calculation Provider supporting standard jurisdiction rates and exemptions
 */
export class DefaultTaxProvider implements TaxProvider {
  private defaultRates: Record<string, number> = {
    US: 8.25,
    GB: 20.0,
    DE: 19.0,
    FR: 20.0,
    CA: 13.0,
    IN: 18.0,
    JP: 10.0,
    AU: 10.0,
  };

  async calculateTax(params: {
    amount: Money;
    billingAddress?: BillingAddress;
    taxId?: string;
    isTaxInclusive: boolean;
  }): Promise<TaxCalculationResult> {
    const country = params.billingAddress?.country?.toUpperCase() || "US";
    const isTaxExempt = Boolean(params.taxId && params.taxId.trim().length > 5);

    if (isTaxExempt) {
      return {
        taxRatePercent: 0,
        taxAmount: new Money(0, params.amount.currency),
        subtotal: params.amount,
        total: params.amount,
        isTaxExempt: true,
        taxJurisdiction: `${country}-EXEMPT`,
      };
    }

    const ratePercent = this.defaultRates[country] || 0;
    const rateFactor = ratePercent / 100;

    let subtotal: Money;
    let taxAmount: Money;
    let total: Money;

    if (params.isTaxInclusive) {
      // Amount already includes tax: total = amount
      // subtotal = total / (1 + rateFactor)
      total = params.amount;
      const subtotalMinor = Math.round(total.minorUnits / (1 + rateFactor));
      subtotal = new Money(subtotalMinor, params.amount.currency);
      taxAmount = total.subtract(subtotal);
    } else {
      // Tax is added on top of amount: subtotal = amount
      subtotal = params.amount;
      taxAmount = subtotal.multiply(rateFactor);
      total = subtotal.add(taxAmount);
    }

    return {
      taxRatePercent: ratePercent,
      taxAmount,
      subtotal,
      total,
      isTaxExempt: false,
      taxJurisdiction: country,
    };
  }
}
