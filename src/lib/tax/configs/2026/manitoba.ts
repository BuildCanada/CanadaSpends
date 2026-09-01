import { ProvincialTaxConfig } from "../../types";

export const MANITOBA_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Manitoba Income Tax",
    // 2026 brackets per CRA (frozen at 2025 levels):
    // https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html
    brackets: [
      { min: 0, max: 47564, rate: 0.108 },
      { min: 47564, max: 101200, rate: 0.1275 },
      { min: 101200, max: null, rate: 0.174 },
    ],
    basicPersonalAmount: 15780,
  },
};
