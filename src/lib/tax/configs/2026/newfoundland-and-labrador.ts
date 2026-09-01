import { ProvincialTaxConfig } from "../../types";

export const NEWFOUNDLAND_AND_LABRADOR_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Newfoundland And Labrador Income Tax",
    // 2026 brackets per CRA:
    // https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html
    brackets: [
      { min: 0, max: 44678, rate: 0.087 },
      { min: 44678, max: 89354, rate: 0.145 },
      { min: 89354, max: 159528, rate: 0.158 },
      { min: 159528, max: 223340, rate: 0.178 },
      { min: 223340, max: 285319, rate: 0.198 },
      { min: 285319, max: 570638, rate: 0.208 },
      { min: 570638, max: 1141275, rate: 0.213 },
      { min: 1141275, max: null, rate: 0.218 },
    ],
    basicPersonalAmount: 11188,
  },
};
