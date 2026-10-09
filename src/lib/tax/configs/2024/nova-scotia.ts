/**
 * Nova Scotia 2024 Tax Configuration
 *
 * Sources:
 * - Tax rates: https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html
 * - Provincial info: https://novascotia.ca/finance/en/home/taxation/personalincometax.aspx
 */
import { ProvincialTaxConfig } from "../../types";

export const NOVA_SCOTIA_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Nova Scotia Income Tax",
    brackets: [
      { min: 0, max: 29590, rate: 0.0879 },
      { min: 29590, max: 59180, rate: 0.1495 },
      { min: 59180, max: 93000, rate: 0.1667 },
      { min: 93000, max: 150000, rate: 0.175 },
      { min: 150000, max: null, rate: 0.21 },
    ],
    basicPersonalAmount: 11481, // $8,481 + $3,000 income-tested supplement
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
      // Income-tested supplement: $3,000 on top of $8,481, reduced by 6% of
      // taxable income over $25,000 (Worksheet NS428). Eliminated in 2025.
      bpaPhaseOut: { minAmount: 8481, start: 25000, end: 75000 },
    },
  },
  // Low-income tax reduction: $300 less 5% of net income over $15,000
  // (NS428).
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
