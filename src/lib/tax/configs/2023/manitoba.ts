import { ProvincialTaxConfig } from "../../types";

export const MANITOBA_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Manitoba Income Tax",
    brackets: [
      { min: 0, max: 36842, rate: 0.108 },
      { min: 36842, max: 79625, rate: 0.1275 },
      { min: 79625, max: null, rate: 0.174 },
    ],
    basicPersonalAmount: 15000,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
};
