import { ProvincialTaxConfig } from "../../types";

export const NOVA_SCOTIA_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Nova Scotia Income Tax",
    // 2026 brackets per CRA:
    // https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html
    brackets: [
      { min: 0, max: 30995, rate: 0.0879 },
      { min: 30995, max: 61991, rate: 0.1495 },
      { min: 61991, max: 97417, rate: 0.1667 },
      { min: 97417, max: 157124, rate: 0.175 },
      { min: 157124, max: null, rate: 0.21 },
    ],
    basicPersonalAmount: 11932,
  },
};
