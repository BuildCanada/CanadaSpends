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
  },
};
