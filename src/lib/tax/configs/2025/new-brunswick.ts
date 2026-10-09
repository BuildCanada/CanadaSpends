/**
 * New Brunswick 2025 Tax Configuration
 *
 * Sources:
 * - Tax rates: https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html
 * - Provincial info: https://www2.gnb.ca/content/gnb/en/departments/finance/taxes/personal_income_tax.html
 */
import { ProvincialTaxConfig } from "../../types";

export const NEW_BRUNSWICK_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "New Brunswick Income Tax",
    brackets: [
      { min: 0, max: 51306, rate: 0.094 },
      { min: 51306, max: 102614, rate: 0.14 },
      { min: 102614, max: 190060, rate: 0.16 },
      { min: 190060, max: null, rate: 0.195 },
    ],
    basicPersonalAmount: 13396,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
  // Low-income tax reduction: $802 less 3% of net income over $21,920
  // (NB428).
  taxReductions: [
    {
      type: "phaseOut",
      id: "nb-low-income",
      name: "Low-Income Tax Reduction",
      maxCredit: 802,
      threshold: 21920,
      reductionRate: 0.03,
    },
  ],
};
