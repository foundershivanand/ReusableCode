import { describe, expect, it } from "vitest";
import { Money } from "../server/money.js";

describe("Money Representation & Arithmetic (Page 15)", () => {
  it("uses exact integer minor units avoiding floating-point precision issues", () => {
    // 0.10 + 0.20 in standard JS float is 0.30000000000000004
    const m1 = Money.fromMajorUnits("0.10", "USD");
    const m2 = Money.fromMajorUnits("0.20", "USD");

    expect(m1.minorUnits).toBe(10);
    expect(m2.minorUnits).toBe(20);

    const sum = m1.add(m2);
    expect(sum.minorUnits).toBe(30);
    expect(sum.format("en-US")).toBe("$0.30");
  });

  it("handles zero-decimal currencies properly (e.g. JPY, KRW)", () => {
    // 1000 JPY has no minor unit subdivision
    const jpy = Money.fromMajorUnits(1000, "JPY");
    expect(jpy.minorUnits).toBe(1000);
    expect(jpy.format("ja-JP")).toBe("￥1,000");

    const doubled = jpy.multiply(2);
    expect(doubled.minorUnits).toBe(2000);
  });

  it("prevents cross-currency arithmetic without explicit conversion", () => {
    const usd = new Money(1000, "USD");
    const eur = new Money(1000, "EUR");

    expect(() => usd.add(eur)).toThrow("Cannot perform arithmetic across different currencies");
    expect(() => usd.subtract(eur)).toThrow("Cannot perform arithmetic across different currencies");
  });

  it("rejects non-integer minor units", () => {
    expect(() => new Money(10.5, "USD")).toThrow("must be an exact integer");
  });
});
