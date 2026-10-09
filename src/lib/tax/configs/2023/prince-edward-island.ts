import { ProvincialTaxConfig } from "../../types";

export const PRINCE_EDWARD_ISLAND_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Prince Edward Island Income Tax",
    brackets: [
      { min: 0, max: 31984, rate: 0.098 },
      { min: 31984, max: 63969, rate: 0.138 },
      { min: 63969, max: null, rate: 0.167 },
    ],
    basicPersonalAmount: 12750,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
  // Low-income tax reduction: $350 less 5% of net income over $20,750
  // (PE428), applied after the surtax.
  taxReductions: [
    {
      type: "phaseOut",
      id: "pe-low-income",
      name: "Low-Income Tax Reduction",
      maxCredit: 350,
      threshold: 20750,
      reductionRate: 0.05,
    },
  ],
  surtax: {
    type: "surtax",
    name: "Prince Edward Island Surtax",
    tiers: [{ threshold: 12500, rate: 0.1 }],
  },
};
