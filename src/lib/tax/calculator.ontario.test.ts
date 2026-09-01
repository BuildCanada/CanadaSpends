import { describe, expect, it } from "vitest";

import { calculateDetailedTax } from "./calculator";
import { calculateSurtax } from "./calculators";
import { getSupportedYears } from "./configs";

// These tests verify the Ontario surtax and health premium against the
// official CRA formulas (T4127 Payroll Deductions Formulas). The surtax
// tiers OVERLAP: 20% of Ontario basic tax over the first threshold PLUS
// 36% of basic tax over the second threshold (V1 = 0.20 × (T4 − $5,710) +
// 0.36 × (T4 − $7,307) for 2025).

/** Marginal rate (in %) at a given income, measured over a $1,000 step. */
function marginalRate(income: number, province: string, year: string) {
  const step = 1000;
  const lo = calculateDetailedTax(income, province, year);
  const hi = calculateDetailedTax(income + step, province, year);
  return ((hi.totalTax - lo.totalTax) / step) * 100;
}

describe("Ontario surtax", () => {
  const config2025 = {
    type: "surtax" as const,
    name: "Ontario Surtax",
    tiers: [
      { threshold: 5710, rate: 0.2 },
      { threshold: 7307, rate: 0.36 },
    ],
  };

  it("charges nothing at or below the first threshold", () => {
    expect(calculateSurtax(5710, config2025)).toBe(0);
    expect(calculateSurtax(1000, config2025)).toBe(0);
  });

  it("charges 20% of basic tax over the first threshold only", () => {
    // T4 = $6,710: V1 = 0.20 × ($6,710 − $5,710) = $200
    expect(calculateSurtax(6710, config2025)).toBeCloseTo(200, 2);
  });

  it("adds both surtaxes above the second threshold (56% combined)", () => {
    // T4 = $10,000: V1 = 0.20 × $4,290 + 0.36 × $2,693 = $858 + $969.48
    expect(calculateSurtax(10000, config2025)).toBeCloseTo(1827.48, 2);
  });

  it("produces the cited 53.53% top combined marginal rate for Ontario", () => {
    // Top marginal = 33% federal + 13.16% × 1.56 (surtax) = 53.5296%
    expect(marginalRate(5_000_000, "ontario", "2025")).toBeCloseTo(53.53, 1);
    expect(marginalRate(5_000_000, "ontario", "2026")).toBeCloseTo(53.53, 1);
  });

  it("approaches the top marginal rate for very high incomes", () => {
    const detailed = calculateDetailedTax(1_000_000_000, "ontario", "2025");
    expect(detailed.effectiveTaxRate).toBeGreaterThan(53.4);
    expect(detailed.effectiveTaxRate).toBeLessThan(53.53);
  });
});

describe("Ontario Health Premium", () => {
  // The premium schedule is fixed (not indexed), so every year must
  // produce the same values at the CRA formula's cap points.
  const years = ["2023", "2024", "2025", "2026"];

  it.each(years)("%s: matches the CRA V2 formula at cap points", (year) => {
    const premiumAt = (income: number) =>
      calculateDetailedTax(income, "ontario", year).healthPremium;

    expect(premiumAt(20000)).toBe(0);
    expect(premiumAt(25000)).toBeCloseTo(300, 2); // 6% of $5,000
    expect(premiumAt(36000)).toBeCloseTo(300, 2); // flat until $36,000
    expect(premiumAt(38500)).toBeCloseTo(450, 2); // $300 + 6% of $2,500
    expect(premiumAt(48600)).toBeCloseTo(600, 2); // $450 + 25% of $600
    expect(premiumAt(72600)).toBeCloseTo(750, 2); // $600 + 25% of $600
    expect(premiumAt(200600)).toBeCloseTo(900, 2); // $750 + 25% of $600
    expect(premiumAt(10_000_000)).toBeCloseTo(900, 2); // capped at $900
  });
});

describe("supported years", () => {
  it("includes 2026", () => {
    expect(getSupportedYears()).toContain("2026");
  });
});
