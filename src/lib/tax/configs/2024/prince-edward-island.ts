/**
 * Prince Edward Island 2024 Tax Configuration
 *
 * Sources:
 * - Tax rates: https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html
 * - Provincial info: https://www.princeedwardisland.ca/en/information/finance/personal-income-tax
 */
import { ProvincialTaxConfig } from "../../types";

export const PRINCE_EDWARD_ISLAND_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Prince Edward Island Income Tax",
    brackets: [
      { min: 0, max: 32656, rate: 0.0965 },
      { min: 32656, max: 64313, rate: 0.1363 },
      { min: 64313, max: 105000, rate: 0.1665 },
      { min: 105000, max: 140000, rate: 0.18 },
      { min: 140000, max: null, rate: 0.1875 },
    ],
    basicPersonalAmount: 13500,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
  // Low-income tax reduction: $350 less 5% of net income over $21,500
  // (PE428), applied after the surtax.
  taxReductions: [
    {
      type: "phaseOut",
      id: "pe-low-income",
      name: "Low-Income Tax Reduction",
      maxCredit: 350,
      threshold: 21500,
      reductionRate: 0.05,
    },
  ],
};
