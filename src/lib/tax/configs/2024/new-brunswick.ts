/**
 * New Brunswick 2024 Tax Configuration
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
      { min: 0, max: 49958, rate: 0.094 },
      { min: 49958, max: 99916, rate: 0.14 },
      { min: 99916, max: 185064, rate: 0.16 },
      { min: 185064, max: null, rate: 0.195 },
    ],
    basicPersonalAmount: 13044,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
  // Low-income tax reduction: $781 less 3% of net income over $21,343
  // (NB428).
  taxReductions: [
    {
      type: "phaseOut",
      id: "nb-low-income",
      name: "Low-Income Tax Reduction",
      maxCredit: 781,
      threshold: 21343,
      reductionRate: 0.03,
    },
  ],
};
