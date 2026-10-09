import { ProvincialTaxConfig } from "../../types";

export const SASKATCHEWAN_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Saskatchewan Income Tax",
    brackets: [
      { min: 0, max: 49720, rate: 0.105 },
      { min: 49720, max: 142058, rate: 0.125 },
      { min: 142058, max: null, rate: 0.145 },
    ],
    basicPersonalAmount: 17661,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
};
