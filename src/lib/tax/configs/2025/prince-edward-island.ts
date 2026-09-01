/**
 * Prince Edward Island 2025 Tax Configuration
 *
 * Sources:
 * - Tax rates: https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html
 * - Provincial info: https://www.princeedwardisland.ca/en/information/finance/personal-income-tax
 */
import { ProvincialTaxConfig } from "../../types";

export const PRINCE_EDWARD_ISLAND_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Prince Edward Island Income Tax",
    brackets: [
      { min: 0, max: 33328, rate: 0.095 },
      { min: 33328, max: 64656, rate: 0.1347 },
      { min: 64656, max: 105000, rate: 0.166 },
      { min: 105000, max: 140000, rate: 0.1762 },
      { min: 140000, max: null, rate: 0.19 },
    ],
    basicPersonalAmount: 14650,
  },
};
