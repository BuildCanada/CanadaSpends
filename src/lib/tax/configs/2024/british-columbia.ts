/**
 * British Columbia 2024 Tax Configuration
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
      { min: 0, max: 47937, rate: 0.0506 },
      { min: 47937, max: 95875, rate: 0.077 },
      { min: 95875, max: 110076, rate: 0.105 },
      { min: 110076, max: 133664, rate: 0.1229 },
      { min: 133664, max: 181232, rate: 0.147 },
      { min: 181232, max: 252752, rate: 0.168 },
      { min: 252752, max: null, rate: 0.205 },
    ],
    basicPersonalAmount: 12580,
    // BC credits base CPP contributions and EI premiums at its lowest rate
    credits: { payrollContributions: true },
  },
  // BC tax reduction credit: $547 reduced by 3.56% of net income over
  // $24,338, applied after non-refundable credits (BC428 Part C).
  // https://www2.gov.bc.ca/gov/content/taxes/income-taxes/personal/credits/basic
  taxReductions: [
    {
      type: "phaseOut",
      id: "bc-tax-reduction",
      name: "BC Tax Reduction Credit",
      maxCredit: 547,
      threshold: 24338,
      reductionRate: 0.0356,
    },
  ],
};
