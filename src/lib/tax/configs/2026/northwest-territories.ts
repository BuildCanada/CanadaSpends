import { ProvincialTaxConfig } from "../../types";

export const NORTHWEST_TERRITORIES_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Northwest Territories Income Tax",
    // 2026 brackets per CRA:
    // https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html
    brackets: [
      { min: 0, max: 53003, rate: 0.059 },
      { min: 53003, max: 106009, rate: 0.086 },
      { min: 106009, max: 172346, rate: 0.122 },
      { min: 172346, max: null, rate: 0.1405 },
    ],
    basicPersonalAmount: 18198,
  },
};
