import { ProvincialTaxConfig } from "../../types";

export const NEWFOUNDLAND_AND_LABRADOR_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Newfoundland And Labrador Income Tax",
    brackets: [
      { min: 0, max: 41457, rate: 0.087 },
      { min: 41457, max: 82913, rate: 0.145 },
      { min: 82913, max: 148027, rate: 0.158 },
      { min: 148027, max: 207239, rate: 0.178 },
      { min: 207239, max: 264750, rate: 0.198 },
      { min: 264750, max: 529500, rate: 0.208 },
      { min: 529500, max: 1059000, rate: 0.213 },
      { min: 1059000, max: null, rate: 0.218 },
    ],
    basicPersonalAmount: 10382,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
  // Low-income tax reduction: $936 less 16% of net income over $22,447
  // (NL428).
  taxReductions: [
    {
      type: "phaseOut",
      id: "nl-low-income",
      name: "Low-Income Tax Reduction",
      maxCredit: 936,
      threshold: 22447,
      reductionRate: 0.16,
    },
  ],
};
