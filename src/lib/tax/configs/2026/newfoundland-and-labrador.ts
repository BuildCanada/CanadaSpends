import { ProvincialTaxConfig } from "../../types";

export const NEWFOUNDLAND_AND_LABRADOR_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Newfoundland And Labrador Income Tax",
    // 2026 brackets per CRA:
    // https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html
    brackets: [
      { min: 0, max: 44678, rate: 0.087 },
      { min: 44678, max: 89354, rate: 0.145 },
      { min: 89354, max: 159528, rate: 0.158 },
      { min: 159528, max: 223340, rate: 0.178 },
      { min: 223340, max: 285319, rate: 0.198 },
      { min: 285319, max: 570638, rate: 0.208 },
      { min: 570638, max: 1141275, rate: 0.213 },
      { min: 1141275, max: null, rate: 0.218 },
    ],
    // 2026 tax-year amount per NL Finance: $11,188 rising to $15,000 mid-year
    basicPersonalAmount: 13094,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
  // Low-income tax reduction: $1,008 less 16% of net income over $24,191
  // (NL428).
  // 2026: indexed from 2025 (1.1%); the NL428 for 2026 isn't published yet
  taxReductions: [
    {
      type: "phaseOut",
      id: "nl-low-income",
      name: "Low-Income Tax Reduction",
      maxCredit: 1008,
      threshold: 24191,
      reductionRate: 0.16,
    },
  ],
};
