/**
 * Yukon 2025 Tax Configuration
 *
 * Sources:
 * - Tax rates: https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html
 * - Territorial info: https://yukon.ca/en/personal-income-tax
 */
import { ProvincialTaxConfig } from "../../types";

export const YUKON_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Yukon Income Tax",
    brackets: [
      { min: 0, max: 57375, rate: 0.064 },
      { min: 57375, max: 114750, rate: 0.09 },
      { min: 114750, max: 177882, rate: 0.109 },
      { min: 177882, max: 500000, rate: 0.128 },
      { min: 500000, max: null, rate: 0.15 },
    ],
    basicPersonalAmount: 16129,
    // Yukon credits base CPP and EI, has its own Canada employment amount
    // (line 58310), and mirrors the federal BPA phase-down (YT428 line 9).
    credits: {
      payrollContributions: true,
      employmentAmount: { name: "Canada employment amount", maxAmount: 1471 },
      bpaPhaseOut: { minAmount: 14538, start: 177882, end: 253414 },
    },
  },
};
