import { ProvincialTaxConfig } from "../../types";

export const NEW_BRUNSWICK_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "New Brunswick Income Tax",
    brackets: [
      { min: 0, max: 47715, rate: 0.094 },
      { min: 47715, max: 95431, rate: 0.14 },
      { min: 95431, max: 176756, rate: 0.16 },
      { min: 176756, max: null, rate: 0.195 },
    ],
    basicPersonalAmount: 12458,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
  // Low-income tax reduction: $746 less 3% of net income over $20,385
  // (NB428).
  taxReductions: [
    {
      type: "phaseOut",
      id: "nb-low-income",
      name: "Low-Income Tax Reduction",
      maxCredit: 746,
      threshold: 20385,
      reductionRate: 0.03,
    },
  ],
};
