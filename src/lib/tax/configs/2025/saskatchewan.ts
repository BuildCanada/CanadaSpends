/**
 * Saskatchewan 2025 Tax Configuration
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
      { min: 0, max: 53463, rate: 0.105 },
      { min: 53463, max: 152750, rate: 0.125 },
      { min: 152750, max: null, rate: 0.145 },
    ],
    // Includes the Saskatchewan Affordability Act $500 increase (per CRA T4127).
    basicPersonalAmount: 19491,
  },
};
