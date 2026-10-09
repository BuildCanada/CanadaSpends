/**
 * Saskatchewan 2024 Tax Configuration
 *
 * Sources:
 * - Tax rates: https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html
 * - Provincial info: https://www.saskatchewan.ca/residents/taxes-and-investments/personal-income-tax
 */
import { ProvincialTaxConfig } from "../../types";

export const SASKATCHEWAN_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Saskatchewan Income Tax",
    brackets: [
      { min: 0, max: 52057, rate: 0.105 },
      { min: 52057, max: 148734, rate: 0.125 },
      { min: 148734, max: null, rate: 0.145 },
    ],
    basicPersonalAmount: 18491,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
};
