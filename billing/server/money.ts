import { Currency, ZERO_DECIMAL_CURRENCIES } from "../schemas/billing-schemas.js";

export class Money {
  readonly minorUnits: number;
  readonly currency: Currency;

  constructor(minorUnits: number, currency: Currency) {
    if (!Number.isInteger(minorUnits)) {
      throw new Error(`Money minorUnits must be an exact integer, received: ${minorUnits}`);
    }
    this.minorUnits = minorUnits;
    this.currency = currency;
  }

  /**
   * Creates a Money instance from major units (e.g. 10.50 USD -> 1050 cents)
   * Safely avoids floating point arithmetic issues by parsing decimal parts.
   */
  static fromMajorUnits(amount: number | string, currency: Currency): Money {
    const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency);
    if (isZeroDecimal) {
      return new Money(Math.round(Number(amount)), currency);
    }

    const str = typeof amount === "number" ? amount.toFixed(2) : amount.trim();
    const parts = str.split(".");
    const whole = parseInt(parts[0] || "0", 10);
    const fraction = parseInt((parts[1] || "00").padEnd(2, "0").slice(0, 2), 10);
    const sign = whole < 0 || str.startsWith("-") ? -1 : 1;

    const minor = Math.abs(whole) * 100 + fraction;
    return new Money(sign * minor, currency);
  }

  /**
   * Formats money as a localized string (e.g. "$10.50", "¥1,000")
   */
  format(locale: string = "en-US"): string {
    const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(this.currency);
    const decimalValue = isZeroDecimal ? this.minorUnits : this.minorUnits / 100;

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: this.currency,
      minimumFractionDigits: isZeroDecimal ? 0 : 2,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(decimalValue);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorUnits + other.minorUnits, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorUnits - other.minorUnits, this.currency);
  }

  multiply(factor: number): Money {
    // Round to nearest integer minor unit
    return new Money(Math.round(this.minorUnits * factor), this.currency);
  }

  isZero(): boolean {
    return this.minorUnits === 0;
  }

  isPositive(): boolean {
    return this.minorUnits > 0;
  }

  isNegative(): boolean {
    return this.minorUnits < 0;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot perform arithmetic across different currencies: ${this.currency} vs ${other.currency}. Perform explicit currency conversion first.`
      );
    }
  }
}
