/**
 * Nunavut 2025 Tax Configuration
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
      { min: 0, max: 54707, rate: 0.04 },
      { min: 54707, max: 109413, rate: 0.07 },
      { min: 109413, max: 177881, rate: 0.09 },
      { min: 177881, max: null, rate: 0.115 },
    ],
    basicPersonalAmount: 19274,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
};
