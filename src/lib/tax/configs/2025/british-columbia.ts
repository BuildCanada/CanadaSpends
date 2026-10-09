/**
 * British Columbia 2025 Tax Configuration
 *
 * Sources:
 * - Tax rates: https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html
 * - Provincial info: https://www2.gov.bc.ca/gov/content/taxes/income-taxes/personal/tax-rates
 */
import { ProvincialTaxConfig } from "../../types";

export const BRITISH_COLUMBIA_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "British Columbia Income Tax",
    brackets: [
      { min: 0, max: 49279, rate: 0.0506 },
      { min: 49279, max: 98560, rate: 0.077 },
      { min: 98560, max: 113158, rate: 0.105 },
      { min: 113158, max: 137407, rate: 0.1229 },
      { min: 137407, max: 186306, rate: 0.147 },
      { min: 186306, max: 259829, rate: 0.168 },
      { min: 259829, max: null, rate: 0.205 },
    ],
    basicPersonalAmount: 12932,
    // BC credits base CPP contributions and EI premiums at its lowest rate
    credits: { payrollContributions: true },
  },
  // BC tax reduction credit: $562 reduced by 3.56% of net income over
  // $25,020, applied after non-refundable credits (BC428 Part C).
  // https://www2.gov.bc.ca/gov/content/taxes/income-taxes/personal/credits/basic
  taxReductions: [
    {
      type: "phaseOut",
      id: "bc-tax-reduction",
      name: "BC Tax Reduction Credit",
      maxCredit: 562,
      threshold: 25020,
      reductionRate: 0.0356,
    },
  ],
};
