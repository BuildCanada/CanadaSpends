import { ProvincialTaxConfig } from "../../types";

export const ONTARIO_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Ontario Income Tax",
    brackets: [
      { min: 0, max: 49231, rate: 0.0505 },
      { min: 49231, max: 98463, rate: 0.0915 },
      { min: 98463, max: 150000, rate: 0.1116 },
      { min: 150000, max: 220000, rate: 0.1216 },
      { min: 220000, max: null, rate: 0.1316 },
    ],
    basicPersonalAmount: 11865,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
  // Applied in order after credits and surtax (ON428 lines 74-85):
  // Ontario Tax Reduction: 2 × $274 − Ontario tax (incl. surtax), then the
  // LIFT credit: min($875, 5.05% of employment income) less 5% of net income
  // over $32,500 (Schedule ON428-A).
  taxReductions: [
    {
      type: "taxOffset",
      id: "ontario-tax-reduction",
      name: "Ontario Tax Reduction",
      basicAmount: 274,
      multiplier: 2,
    },
    {
      type: "phaseOut",
      id: "ontario-lift",
      name: "Low-income Individuals and Families Tax (LIFT) credit",
      maxCredit: 875,
      threshold: 32500,
      reductionRate: 0.05,
      maxRateOfEmploymentIncome: 0.0505,
    },
  ],
  surtax: {
    type: "surtax",
    name: "Ontario Surtax",
    tiers: [
      { threshold: 5315, rate: 0.2 },
      { threshold: 6802, rate: 0.36 },
    ],
  },
  healthPremium: {
    type: "healthPremium",
    name: "Ontario Health Premium",
    tiers: [
      { minIncome: 0, maxIncome: 20000, baseAmount: 0, rate: 0, maxAmount: 0 },
      {
        minIncome: 20000,
        maxIncome: 36000,
        baseAmount: 0,
        rate: 0.06,
        maxAmount: 300,
      },
      {
        minIncome: 36000,
        maxIncome: 48000,
        baseAmount: 300,
        rate: 0.06,
        maxAmount: 450,
      },
      {
        minIncome: 48000,
        maxIncome: 72000,
        baseAmount: 450,
        rate: 0.25,
        maxAmount: 600,
      },
      {
        minIncome: 72000,
        maxIncome: 200000,
        baseAmount: 600,
        rate: 0.25,
        maxAmount: 750,
      },
      {
        minIncome: 200000,
        maxIncome: null,
        baseAmount: 750,
        rate: 0.25,
        maxAmount: 900,
      },
    ],
  },
};
