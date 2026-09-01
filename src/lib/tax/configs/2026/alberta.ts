import { ProvincialTaxConfig } from "../../types";

export const ALBERTA_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Alberta Income Tax",
    // 2026 brackets per CRA:
    // https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html
    brackets: [
      { min: 0, max: 61200, rate: 0.08 },
      { min: 61200, max: 154259, rate: 0.1 },
      { min: 154259, max: 185111, rate: 0.12 },
      { min: 185111, max: 246813, rate: 0.13 },
      { min: 246813, max: 370220, rate: 0.14 },
      { min: 370220, max: null, rate: 0.15 },
    ],
    basicPersonalAmount: 22769,
  },
};
