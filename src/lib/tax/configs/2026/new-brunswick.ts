import { ProvincialTaxConfig } from "../../types";

export const NEW_BRUNSWICK_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "New Brunswick Income Tax",
    // 2026 brackets per CRA:
    // https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html
    brackets: [
      { min: 0, max: 52333, rate: 0.094 },
      { min: 52333, max: 104666, rate: 0.14 },
      { min: 104666, max: 193861, rate: 0.16 },
      { min: 193861, max: null, rate: 0.195 },
    ],
    basicPersonalAmount: 13664,
  },
};
