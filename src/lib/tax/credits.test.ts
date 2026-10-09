import { describe, expect, it } from "vitest";

import {
  basicPersonalAmountFor,
  calculateIncomeCredits,
  calculateIncomeTax,
  calculateTaxReductions,
} from "./calculators";
import { BracketTaxConfig, TaxReductionConfig } from "./types";

const config: BracketTaxConfig = {
  type: "bracket",
  name: "Test Income Tax",
  brackets: [
    { min: 0, max: 50000, rate: 0.1 },
    { min: 50000, max: null, rate: 0.2 },
  ],
  basicPersonalAmount: 10000,
};

const inputs = {
  netIncome: 60000,
  employmentIncome: 60000,
  payrollContributions: 4000,
};

describe("basicPersonalAmountFor", () => {
  const phaseOut = { minAmount: 8000, start: 100000, end: 200000 };

  it("is the full amount up to the start of the phase-out", () => {
    expect(basicPersonalAmountFor(100000, 10000, phaseOut)).toBe(10000);
  });

  it("falls linearly to the minimum across the range", () => {
    expect(basicPersonalAmountFor(150000, 10000, phaseOut)).toBe(9000);
  });

  it("is the minimum from the end of the range", () => {
    expect(basicPersonalAmountFor(250000, 10000, phaseOut)).toBe(8000);
  });

  it("is the full amount when there's no phase-out", () => {
    expect(basicPersonalAmountFor(1_000_000, 10000)).toBe(10000);
  });
});

describe("calculateIncomeCredits", () => {
  it("only gives the BPA when no other credits are configured", () => {
    expect(calculateIncomeCredits(config, inputs)).toEqual([
      {
        id: "basicPersonalAmount",
        name: "Basic personal amount",
        amount: 10000,
        value: 1000,
      },
    ]);
  });

  it("credits payroll contributions and the employment amount at the lowest rate", () => {
    const credits = calculateIncomeCredits(
      {
        ...config,
        credits: {
          payrollContributions: true,
          employmentAmount: { name: "Employment amount", maxAmount: 1500 },
        },
      },
      { ...inputs, employmentIncome: 1000 },
    );
    expect(credits.map((c) => [c.id, c.amount, c.value])).toEqual([
      ["basicPersonalAmount", 10000, 1000],
      ["payrollContributions", 4000, 400],
      // Lesser of employment income ($1,000) and the maximum ($1,500)
      ["employmentAmount", 1000, 100],
    ]);
  });
});

describe("calculateIncomeTax", () => {
  it("subtracts credits from bracket tax, never below zero", () => {
    // $50k × 10% + $10k × 20% = $7,000, less the $1,000 BPA credit
    expect(calculateIncomeTax(60000, config, inputs)).toMatchObject({
      taxBeforeCredits: 7000,
      tax: 6000,
    });
    expect(calculateIncomeTax(5000, config, inputs).tax).toBe(0);
  });
});

describe("calculateTaxReductions", () => {
  const phaseOut: TaxReductionConfig = {
    type: "phaseOut",
    id: "low-income",
    name: "Low-income reduction",
    maxCredit: 500,
    threshold: 20000,
    reductionRate: 0.05,
  };

  it("reduces the maximum by a share of net income above the threshold", () => {
    // $500 − 5% × ($24,000 − $20,000) = $300
    expect(
      calculateTaxReductions(1000, [phaseOut], {
        netIncome: 24000,
        employmentIncome: 24000,
      }),
    ).toEqual([
      { id: "low-income", name: "Low-income reduction", amount: 300 },
    ]);
  });

  it("caps the credit at a share of employment income when configured", () => {
    const capped = { ...phaseOut, maxRateOfEmploymentIncome: 0.05 };
    // min($500, 5% × $4,000 = $200), no phase-out below the threshold
    expect(
      calculateTaxReductions(1000, [capped], {
        netIncome: 4000,
        employmentIncome: 4000,
      })[0].amount,
    ).toBe(200);
  });

  it("applies 'multiplier × amount − tax' offsets", () => {
    const offset: TaxReductionConfig = {
      type: "taxOffset",
      id: "offset",
      name: "Offset reduction",
      basicAmount: 300,
      multiplier: 2,
    };
    // 2 × $300 − $450 = $150
    expect(
      calculateTaxReductions(450, [offset], {
        netIncome: 20000,
        employmentIncome: 20000,
      })[0].amount,
    ).toBe(150);
    // Tax above 2 × $300: nothing
    expect(
      calculateTaxReductions(700, [offset], {
        netIncome: 20000,
        employmentIncome: 20000,
      }),
    ).toEqual([]);
  });

  it("applies reductions in order and never below zero tax", () => {
    const lines = calculateTaxReductions(
      400,
      [phaseOut, { ...phaseOut, id: "second", name: "Second" }],
      { netIncome: 10000, employmentIncome: 10000 },
    );
    expect(lines.map((l) => [l.id, l.amount])).toEqual([["low-income", 400]]);
  });
});
