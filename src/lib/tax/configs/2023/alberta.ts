import { ProvincialTaxConfig } from "../../types";

export const ALBERTA_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Alberta Income Tax",
    brackets: [
      { min: 0, max: 142292, rate: 0.1 },
      { min: 142292, max: 170751, rate: 0.12 },
      { min: 170751, max: 227668, rate: 0.13 },
      { min: 227668, max: 341502, rate: 0.14 },
      { min: 341502, max: null, rate: 0.15 },
    ],
    basicPersonalAmount: 21003,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
};
