import { ProvincialTaxConfig } from "../../types";

export const BRITISH_COLUMBIA_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "British Columbia Income Tax",
    // 2026 brackets per CRA (note: the lowest rate rises to 5.6% in 2026):
    // https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html
    brackets: [
      { min: 0, max: 50363, rate: 0.056 },
      { min: 50363, max: 100728, rate: 0.077 },
      { min: 100728, max: 115648, rate: 0.105 },
      { min: 115648, max: 140430, rate: 0.1229 },
      { min: 140430, max: 190405, rate: 0.147 },
      { min: 190405, max: 265545, rate: 0.168 },
      { min: 265545, max: null, rate: 0.205 },
    ],
    basicPersonalAmount: 13216,
    // BC credits base CPP contributions and EI premiums at its lowest rate
    credits: { payrollContributions: true },
  },
  // BC tax reduction credit: $690 reduced by 3.56% of net income over
  // $25,570, applied after non-refundable credits (BC428 Part C).
  // https://www2.gov.bc.ca/gov/content/taxes/income-taxes/personal/credits/basic
  taxReductions: [
    {
      type: "phaseOut",
      id: "bc-tax-reduction",
      name: "BC Tax Reduction Credit",
      maxCredit: 690,
      threshold: 25570,
      reductionRate: 0.0356,
    },
  ],
};
