import { ProvincialTaxConfig } from "../../types";

export const NUNAVUT_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Nunavut Income Tax",
    // 2026 brackets per CRA:
    // https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html
    brackets: [
      { min: 0, max: 55801, rate: 0.04 },
      { min: 55801, max: 111602, rate: 0.07 },
      { min: 111602, max: 181439, rate: 0.09 },
      { min: 181439, max: null, rate: 0.115 },
    ],
    basicPersonalAmount: 19659,
  },
};
