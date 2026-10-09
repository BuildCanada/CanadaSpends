/**
 * Newfoundland and Labrador 2025 Tax Configuration
 *
 * Sources:
 * - Tax rates: https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html
 * - Provincial info: https://www.gov.nl.ca/fin/tax-programs-incentives/personal/income-tax/
 */
import { ProvincialTaxConfig } from "../../types";

export const NEWFOUNDLAND_AND_LABRADOR_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Newfoundland and Labrador Income Tax",
    brackets: [
      { min: 0, max: 44192, rate: 0.087 },
      { min: 44192, max: 88382, rate: 0.145 },
      { min: 88382, max: 157792, rate: 0.158 },
      { min: 157792, max: 220910, rate: 0.178 },
      { min: 220910, max: 282214, rate: 0.198 },
      { min: 282214, max: 564429, rate: 0.208 },
      { min: 564429, max: 1128858, rate: 0.213 },
      { min: 1128858, max: null, rate: 0.218 },
    ],
    basicPersonalAmount: 11067,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
  // Low-income tax reduction: $997 less 16% of net income over $23,928
  // (NL428).
  taxReductions: [
    {
      type: "phaseOut",
      id: "nl-low-income",
      name: "Low-Income Tax Reduction",
      maxCredit: 997,
      threshold: 23928,
      reductionRate: 0.16,
    },
  ],
};
