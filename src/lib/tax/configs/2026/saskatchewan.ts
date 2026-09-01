import { ProvincialTaxConfig } from "../../types";

export const SASKATCHEWAN_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Saskatchewan Income Tax",
    // 2026 brackets per CRA:
    // https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html
    brackets: [
      { min: 0, max: 54532, rate: 0.105 },
      { min: 54532, max: 155805, rate: 0.125 },
      { min: 155805, max: null, rate: 0.145 },
    ],
    basicPersonalAmount: 20381,
  },
};
