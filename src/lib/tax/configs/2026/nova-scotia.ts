import { ProvincialTaxConfig } from "../../types";

export const NOVA_SCOTIA_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Nova Scotia Income Tax",
    // 2026 brackets per CRA:
    // https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html
    brackets: [
      { min: 0, max: 30995, rate: 0.0879 },
      { min: 30995, max: 61991, rate: 0.1495 },
      { min: 61991, max: 97417, rate: 0.1667 },
      { min: 97417, max: 157124, rate: 0.175 },
      { min: 157124, max: null, rate: 0.21 },
    ],
    basicPersonalAmount: 11932,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
  // Low-income tax reduction: $300 less 5% of net income over $15,000
  // (NS428).
  // 2026: unchanged (not indexed); the NS428 for 2026 isn't published yet
  taxReductions: [
    {
      type: "phaseOut",
      id: "ns-low-income",
      name: "Low-Income Tax Reduction",
      maxCredit: 300,
      threshold: 15000,
      reductionRate: 0.05,
    },
  ],
};
