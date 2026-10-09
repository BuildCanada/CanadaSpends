import { describe, expect, it } from "vitest";

import { calculateDetailedTax } from "./calculator";
import { calculateTaxFromBrackets } from "./calculators";
import { getSupportedProvinces, getTaxConfig } from "./configs";
import { CreditLine } from "./types";

// Income-based non-refundable credits and low-income reductions, checked
// against published CRA and provincial figures (CRA 428 forms, Federal
// Worksheet 5000-D1, T4127 Payroll Deductions Formulas, the line 30800 and
// 31260 pages, and provincial finance sites).

const credit = (lines: CreditLine[], id: CreditLine["id"]) =>
  lines.find((l) => l.id === id)?.amount ?? 0;

describe("CPP/QPP and EI credits (lines 30800, 31200, 31205)", () => {
  it.each([
    // year, base CPP maximum, EI maximum (T4127 / line 30800 page)
    ["2023", 3123.45, 1002.45],
    ["2024", 3217.5, 1049.12],
    ["2025", 3356.1, 1077.48],
    ["2026", 3519.45, 1123.07],
  ])(
    "credits the maximum base CPP and EI federally and provincially in %s",
    (year, cppBase, ei) => {
      const detailed = calculateDetailedTax(150000, "ontario", year);
      for (const lines of [
        detailed.federalCredits,
        detailed.provincialCredits,
      ]) {
        expect(credit(lines, "payrollContributions")).toBeCloseTo(
          cppBase + ei,
          1,
        );
      }
    },
  );

  it.each([
    // year, QPP base maximum, Quebec EI maximum, QPIP maximum
    ["2023", 3407.4, 781.05, 449.54],
    ["2024", 3510.0, 834.24, 464.36],
    ["2025", 3661.2, 860.67, 484.12],
    ["2026", 3768.3, 895.7, 442.9],
  ])(
    "credits QPP base, EI and QPIP federally (not provincially) for Quebec in %s",
    (year, qppBase, ei, qpip) => {
      const detailed = calculateDetailedTax(150000, "quebec", year);
      expect(
        credit(detailed.federalCredits, "payrollContributions"),
      ).toBeCloseTo(qppBase + ei + qpip, 1);
      // Quebec builds these into its basic personal amount instead
      expect(credit(detailed.provincialCredits, "payrollContributions")).toBe(
        0,
      );
    },
  );

  it("credits only part of the contributions at lower incomes", () => {
    // 2025 Ontario at $40,000: base CPP = ($40,000 − $3,500) × 4.95%,
    // EI = $40,000 × 1.64%
    const detailed = calculateDetailedTax(40000, "ontario", "2025");
    expect(credit(detailed.federalCredits, "payrollContributions")).toBeCloseTo(
      36500 * 0.0495 + 40000 * 0.0164,
      2,
    );
  });
});

describe("Canada employment amount (line 31260)", () => {
  it.each([
    ["2023", 1368],
    ["2024", 1433],
    ["2025", 1471],
    ["2026", 1501],
  ])("is capped at the %s maximum", (year, max) => {
    const detailed = calculateDetailedTax(60000, "ontario", year);
    expect(credit(detailed.federalCredits, "employmentAmount")).toBe(max);
  });

  it("is limited to employment income", () => {
    const detailed = calculateDetailedTax(1000, "ontario", "2025");
    expect(credit(detailed.federalCredits, "employmentAmount")).toBe(1000);
  });

  it("is federal only, except Yukon which has its own", () => {
    expect(
      credit(
        calculateDetailedTax(60000, "ontario", "2025").provincialCredits,
        "employmentAmount",
      ),
    ).toBe(0);
    expect(
      credit(
        calculateDetailedTax(60000, "yukon", "2025").provincialCredits,
        "employmentAmount",
      ),
    ).toBe(1471);
  });
});

describe("Federal basic personal amount phase-down (line 30000)", () => {
  // year, max, min, phase-down start, end (Worksheet 5000-D1; T4127 2026)
  const cases = [
    ["2023", 15000, 13520, 165430, 235675],
    ["2024", 15705, 14156, 173205, 246752],
    ["2025", 16129, 14538, 177882, 253414],
    ["2026", 16452, 14829, 181440, 258482],
  ] as const;

  it.each(cases)(
    "is the full amount below, halfway through, and the minimum above the %s range",
    (year, max, min, start, end) => {
      // Net income = gross − line 22215 deduction, so solve for the gross
      // that lands on a given net income by adding the deduction back.
      const at = (netIncome: number) => {
        const probe = calculateDetailedTax(netIncome, "ontario", year);
        const detailed = calculateDetailedTax(
          netIncome + probe.cppQppEnhancedDeduction,
          "ontario",
          year,
        );
        return credit(detailed.federalCredits, "basicPersonalAmount");
      };
      expect(at(start - 1000)).toBe(max);
      expect(at((start + end) / 2)).toBeCloseTo((max + min) / 2, 0);
      expect(at(end + 1000)).toBe(min);
    },
  );

  it("is mirrored by Yukon", () => {
    const detailed = calculateDetailedTax(400000, "yukon", "2025");
    expect(credit(detailed.provincialCredits, "basicPersonalAmount")).toBe(
      14538,
    );
  });
});

describe("Provincial basic personal amounts", () => {
  it("phases out Nova Scotia's $3,000 supplement in 2023 and 2024", () => {
    // $8,481 + $3,000 − 6% × (taxable income − $25,000)
    for (const year of ["2023", "2024"]) {
      const at = (income: number) =>
        calculateDetailedTax(income, "nova-scotia", year);
      const mid = at(50000);
      expect(credit(mid.provincialCredits, "basicPersonalAmount")).toBeCloseTo(
        11481 - 0.06 * (mid.provincialTaxableIncome - 25000),
        6,
      );
      expect(credit(at(20000).provincialCredits, "basicPersonalAmount")).toBe(
        11481,
      );
      expect(credit(at(90000).provincialCredits, "basicPersonalAmount")).toBe(
        8481,
      );
    }
    // Eliminated in 2025: a flat $11,744 at any income
    expect(
      credit(
        calculateDetailedTax(90000, "nova-scotia", "2025").provincialCredits,
        "basicPersonalAmount",
      ),
    ).toBe(11744);
  });

  it("phases out Manitoba's BPA between $200k and $400k from 2025", () => {
    for (const year of ["2025", "2026"]) {
      const detailed = calculateDetailedTax(300000, "manitoba", year);
      const netIncome = detailed.provincialTaxableIncome;
      expect(
        credit(detailed.provincialCredits, "basicPersonalAmount"),
      ).toBeCloseTo(15780 * (1 - (netIncome - 200000) / 200000), 6);
      expect(
        credit(
          calculateDetailedTax(450000, "manitoba", year).provincialCredits,
          "basicPersonalAmount",
        ),
      ).toBe(0);
    }
    // Not income-tested in 2024
    expect(
      credit(
        calculateDetailedTax(450000, "manitoba", "2024").provincialCredits,
        "basicPersonalAmount",
      ),
    ).toBe(15780);
  });

  it("uses Newfoundland and Labrador's 2026 tax-year BPA of $13,094", () => {
    expect(
      getTaxConfig("2026", "newfoundland-and-labrador")!.provincial.incomeTax
        .basicPersonalAmount,
    ).toBe(13094);
  });
});

describe("Quebec deduction for workers (TP-1 line 201)", () => {
  it.each([
    ["2023", 1315],
    ["2024", 1380],
    ["2025", 1420],
    ["2026", 1450],
  ])("is 6% of employment income up to the %s maximum", (year, max) => {
    expect(
      calculateDetailedTax(15000, "quebec", year).provincialEmploymentDeduction,
    ).toBeCloseTo(900, 6);
    expect(
      calculateDetailedTax(60000, "quebec", year).provincialEmploymentDeduction,
    ).toBe(max);
  });

  it("reduces Quebec taxable income only", () => {
    const detailed = calculateDetailedTax(60000, "quebec", "2025");
    const config = getTaxConfig("2025", "quebec")!;
    const federalTaxable = 60000 - detailed.cppQppEnhancedDeduction;
    expect(detailed.provincialTaxableIncome).toBeCloseTo(
      federalTaxable - 1420,
      6,
    );
    expect(detailed.federalIncomeTaxBeforeCredits).toBeCloseTo(
      calculateTaxFromBrackets(
        federalTaxable,
        config.federal.incomeTax.brackets,
      ),
      6,
    );
  });

  it("uses the 2026 QPP base rate of 5.3% for the line 22215 deduction", () => {
    // 2026: QPP 6.3% = 5.3% base + 1.0% first additional, on earnings up to
    // the $74,600 YMPE above the $3,500 exemption; QPP2 4% up to $85,000
    const detailed = calculateDetailedTax(100000, "quebec", "2026");
    expect(detailed.cppQppEnhancedDeduction).toBeCloseTo(
      (74600 - 3500) * 0.01 + (85000 - 74600) * 0.04,
      2,
    );
  });
});

describe("Low-income tax reductions", () => {
  const reduction = (province: string, year: string, income: number) => {
    const detailed = calculateDetailedTax(income, province, year);
    return { detailed, total: detailed.provincialTaxReduction };
  };

  // province, year, max, net-income threshold, reduction rate (428 forms)
  const phaseOuts = [
    ["british-columbia", "2023", 521, 23179, 0.0356],
    ["british-columbia", "2024", 547, 24338, 0.0356],
    ["british-columbia", "2025", 562, 25020, 0.0356],
    ["british-columbia", "2026", 690, 25570, 0.0356],
    ["new-brunswick", "2023", 746, 20385, 0.03],
    ["new-brunswick", "2024", 781, 21343, 0.03],
    ["new-brunswick", "2025", 802, 21920, 0.03],
    ["nova-scotia", "2025", 300, 15000, 0.05],
    ["prince-edward-island", "2023", 350, 20750, 0.05],
    ["prince-edward-island", "2024", 350, 21500, 0.05],
    ["prince-edward-island", "2025", 350, 22650, 0.05],
    ["newfoundland-and-labrador", "2023", 936, 22447, 0.16],
    ["newfoundland-and-labrador", "2024", 974, 23390, 0.16],
    ["newfoundland-and-labrador", "2025", 997, 23928, 0.16],
  ] as const;

  it.each(phaseOuts)(
    "%s %s: maximum less its rate on net income over the threshold",
    (province, year, max, threshold, rate) => {
      // Partway through the phase-out, where provincial tax is larger than
      // the reduction
      const netTarget = threshold + (max / rate) * 0.4;
      const { detailed, total } = reduction(province, year, netTarget + 300);
      const netIncome = detailed.provincialTaxableIncome;
      const expected = max - rate * (netIncome - threshold);
      expect(detailed.provincialIncomeTax + detailed.surtax).toBeGreaterThan(
        expected,
      );
      expect(total).toBeCloseTo(expected, 6);
      // Gone above the end of the phase-out
      expect(
        reduction(province, year, threshold + max / rate + 2000).total,
      ).toBe(0);
    },
  );

  it("never makes provincial income tax negative", () => {
    for (const province of getSupportedProvinces("2025")) {
      for (const income of [5000, 12000, 20000, 30000]) {
        const detailed = calculateDetailedTax(income, province, "2025");
        expect(detailed.provincialTaxReduction).toBeLessThanOrEqual(
          detailed.provincialIncomeTax + detailed.surtax + 1e-9,
        );
      }
    }
  });

  describe("Ontario", () => {
    it("applies the Ontario Tax Reduction as 2 × $294 − Ontario tax (2025)", () => {
      // At an income where Ontario tax is just above 2 × $294 but LIFT is
      // fully phased out (net income over $50,000)
      const detailed = calculateDetailedTax(52000, "ontario", "2025");
      const ontarioTax = detailed.provincialIncomeTax + detailed.surtax;
      const expected = Math.max(0, 2 * 294 - ontarioTax);
      const lines = detailed.provincialTaxReductions;
      expect(lines.find((l) => l.id === "ontario-lift")).toBeUndefined();
      expect(
        lines.find((l) => l.id === "ontario-tax-reduction")?.amount ?? 0,
      ).toBeCloseTo(expected, 6);
    });

    it("phases LIFT out above $32,500 of net income", () => {
      // 2025 at $40,000: no Ontario Tax Reduction (Ontario tax > 2 × $294),
      // LIFT = $875 − 5% × (net income − $32,500)
      const detailed = calculateDetailedTax(40000, "ontario", "2025");
      const lines = detailed.provincialTaxReductions;
      expect(lines.map((l) => l.id)).toEqual(["ontario-lift"]);
      expect(lines[0].amount).toBeCloseTo(
        875 - 0.05 * (detailed.provincialTaxableIncome - 32500),
        6,
      );
    });

    it("applies the Ontario Tax Reduction first, then LIFT", () => {
      // 2026 at $25,000 both apply: the reduction is 2 × $300 − Ontario tax,
      // then LIFT ($875 here) takes what's left of Ontario tax to zero.
      const detailed = calculateDetailedTax(25000, "ontario", "2026");
      const ontarioTax = detailed.provincialIncomeTax + detailed.surtax;
      const [first, second] = detailed.provincialTaxReductions;
      expect(first.id).toBe("ontario-tax-reduction");
      expect(first.amount).toBeCloseTo(2 * 300 - ontarioTax, 6);
      expect(first.amount).toBeGreaterThan(0);
      expect(second.id).toBe("ontario-lift");
      expect(second.amount).toBeCloseTo(ontarioTax - first.amount, 6);
      expect(detailed.provincialTaxReduction).toBeCloseTo(ontarioTax, 6);
    });

    it("caps LIFT at 5.05% of employment income", () => {
      // At $12,000, 5.05% × $12,000 = $606 < $875 (if there's that much tax)
      const config = getTaxConfig("2025", "ontario")!.provincial;
      const lift = config.taxReductions!.find((r) => r.id === "ontario-lift");
      expect(lift).toMatchObject({
        maxCredit: 875,
        maxRateOfEmploymentIncome: 0.0505,
      });
    });
  });
});
