import { ProvincialTaxConfig } from "../../types";

export const NORTHWEST_TERRITORIES_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Northwest Territories Income Tax",
    brackets: [
      { min: 0, max: 48326, rate: 0.059 },
      { min: 48326, max: 96655, rate: 0.086 },
      { min: 96655, max: 157139, rate: 0.122 },
      { min: 157139, max: null, rate: 0.1405 },
    ],
    basicPersonalAmount: 16593,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
};
