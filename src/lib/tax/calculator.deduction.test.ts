import { describe, expect, it } from "vitest";

import { calculateDetailedTax } from "./calculator";
import { calculateBracketTax } from "./calculators";
import { getTaxConfig } from "./configs";

// CRA line 22215: deduction for the "enhanced" portion of CPP/QPP
// contributions on employment income.
// - For CPP: the rate above the pre-2019 base of 4.95% (currently 1.0%)
//   on first-tier pensionable earnings is deductible, plus 100% of CPP2.
// - For QPP: the rate above the pre-2019 base of 5.40% on first-tier
//   pensionable earnings is deductible, plus 100% of QPP2.

describe("CPP/QPP enhanced contribution deduction (line 22215)", () => {
  it("computes CPP enhanced deduction for Ontario 2024 above YMPE", () => {
    // 2024 CPP: rate 5.95%, base 4.95%, exemption $3,500, YMPE $68,500.
    // CPP1 = ($68,500 − $3,500) × 5.95% = $3,867.50
    // Enhanced portion = $3,867.50 × (1.0% / 5.95%) = $650.00
    // CPP2 = ($73,200 − $68,500) × 4% = $188.00 (fully deductible)
    // Total deduction = $650.00 + $188.00 = $838.00
    const detailed = calculateDetailedTax(80000, "ontario", "2024");
    expect(detailed.cppQppEnhancedDeduction).toBeCloseTo(838, 2);
  });

  it("computes QPP enhanced deduction for Quebec 2024 above YMPE", () => {
    // 2024 QPP: rate 6.40%, base 5.40%, exemption $3,500, YMPE $68,500.
    // QPP1 = ($68,500 − $3,500) × 6.40% = $4,160.00
    // Enhanced portion = $4,160.00 × (1.0% / 6.40%) = $650.00
    // QPP2 = ($73,200 − $68,500) × 4% = $188.00 (fully deductible)
    // Total deduction = $650.00 + $188.00 = $838.00
    const detailed = calculateDetailedTax(80000, "quebec", "2024");
    expect(detailed.cppQppEnhancedDeduction).toBeCloseTo(838, 2);
  });

  it("scales the deduction proportionally for low income", () => {
    // 2024 Ontario at $30,000:
    // CPP1 = ($30,000 − $3,500) × 5.95% = $1,576.75
    // Enhanced portion = $1,576.75 × (1.0% / 5.95%) ≈ $264.99
    // CPP2 = 0 (income below YMPE)
    const detailed = calculateDetailedTax(30000, "ontario", "2024");
    expect(detailed.cppQppEnhancedDeduction).toBeCloseTo(264.99, 1);
  });

  it("applies the deduction to taxable income for both federal and provincial brackets", () => {
    // Ontario 2024 at $80,000 the deduction is $838 (see above), so income
    // tax at both levels must equal the bracket tax on $79,162.
    const config = getTaxConfig("2024", "ontario")!;
    const detailed = calculateDetailedTax(80000, "ontario", "2024");
    expect(detailed.federalIncomeTax).toBeCloseTo(
      calculateBracketTax(80000 - 838, config.federal.incomeTax),
      2,
    );
    expect(detailed.provincialIncomeTax).toBeCloseTo(
      calculateBracketTax(80000 - 838, config.provincial.incomeTax),
      2,
    );
  });
});
