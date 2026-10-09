import { ProvincialTaxConfig } from "../../types";

export const NUNAVUT_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Nunavut Income Tax",
    brackets: [
      { min: 0, max: 50877, rate: 0.04 },
      { min: 50877, max: 101754, rate: 0.07 },
      { min: 101754, max: 165429, rate: 0.09 },
      { min: 165429, max: null, rate: 0.115 },
    ],
    basicPersonalAmount: 17925,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
};
