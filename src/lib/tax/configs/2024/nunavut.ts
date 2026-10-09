/**
 * Nunavut 2024 Tax Configuration
 *
 * Sources:
 * - Tax rates: https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html
 * - Territorial info: https://www.gov.nu.ca/finance/information/personal-income-tax
 */
import { ProvincialTaxConfig } from "../../types";

export const NUNAVUT_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Nunavut Income Tax",
    brackets: [
      { min: 0, max: 53268, rate: 0.04 },
      { min: 53268, max: 106537, rate: 0.07 },
      { min: 106537, max: 173205, rate: 0.09 },
      { min: 173205, max: null, rate: 0.115 },
    ],
    basicPersonalAmount: 18767,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
};
