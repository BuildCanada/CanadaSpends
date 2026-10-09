/**
 * Northwest Territories 2024 Tax Configuration
 *
 * Sources:
 * - Tax rates: https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html
 * - Territorial info: https://www.fin.gov.nt.ca/en/services/personal-income-tax
 */
import { ProvincialTaxConfig } from "../../types";

export const NORTHWEST_TERRITORIES_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Northwest Territories Income Tax",
    brackets: [
      { min: 0, max: 50597, rate: 0.059 },
      { min: 50597, max: 101198, rate: 0.086 },
      { min: 101198, max: 164525, rate: 0.122 },
      { min: 164525, max: null, rate: 0.1405 },
    ],
    basicPersonalAmount: 17373,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
};
