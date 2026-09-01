import { ProvincialTaxConfig } from "../../types";

export const PRINCE_EDWARD_ISLAND_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Prince Edward Island Income Tax",
    // 2026 brackets per CRA (adds a sixth 20% bracket over $200,000):
    // https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html
    brackets: [
      { min: 0, max: 33928, rate: 0.095 },
      { min: 33928, max: 65820, rate: 0.1347 },
      { min: 65820, max: 106890, rate: 0.166 },
      { min: 106890, max: 142520, rate: 0.1762 },
      { min: 142520, max: 200000, rate: 0.19 },
      { min: 200000, max: null, rate: 0.2 },
    ],
    basicPersonalAmount: 15000,
  },
  // Note: PEI surtax was eliminated in 2024 and replaced with 5-bracket system
};
