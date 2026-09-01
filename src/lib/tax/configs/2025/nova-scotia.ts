/**
 * Nova Scotia 2025 Tax Configuration
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
      { min: 0, max: 30507, rate: 0.0879 },
      { min: 30507, max: 61015, rate: 0.1495 },
      { min: 61015, max: 95883, rate: 0.1667 },
      { min: 95883, max: 154650, rate: 0.175 },
      { min: 154650, max: null, rate: 0.21 },
    ],
    // NS raised the BPA to $11,744 for all filers in 2025 (per CRA T4127).
    basicPersonalAmount: 11744,
  },
};
