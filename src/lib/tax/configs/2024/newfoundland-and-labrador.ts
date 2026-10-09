/**
 * Newfoundland and Labrador 2024 Tax Configuration
 *
 * Sources:
 * - Tax rates: https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html
 * - Provincial info: https://www.gov.nl.ca/fin/tax-programs-incentives/personal/income-tax/
 */
import { ProvincialTaxConfig } from "../../types";

export const NEWFOUNDLAND_AND_LABRADOR_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Newfoundland and Labrador Income Tax",
    brackets: [
      { min: 0, max: 43198, rate: 0.087 },
      { min: 43198, max: 86395, rate: 0.145 },
      { min: 86395, max: 154244, rate: 0.158 },
      { min: 154244, max: 215943, rate: 0.178 },
      { min: 215943, max: 275870, rate: 0.198 },
      { min: 275870, max: 551739, rate: 0.208 },
      { min: 551739, max: 1103478, rate: 0.213 },
      { min: 1103478, max: null, rate: 0.218 },
    ],
    basicPersonalAmount: 10818,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
  // Low-income tax reduction: $974 less 16% of net income over $23,390
  // (NL428).
  taxReductions: [
    {
      type: "phaseOut",
      id: "nl-low-income",
      name: "Low-Income Tax Reduction",
      maxCredit: 974,
      threshold: 23390,
      reductionRate: 0.16,
    },
  ],
};
