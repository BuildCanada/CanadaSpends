/**
 * Yukon 2024 Tax Configuration
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
      { min: 0, max: 55867, rate: 0.064 },
      { min: 55867, max: 111733, rate: 0.09 },
      { min: 111733, max: 173205, rate: 0.109 },
      { min: 173205, max: 500000, rate: 0.128 },
      { min: 500000, max: null, rate: 0.15 },
    ],
    basicPersonalAmount: 15705,
    // Yukon credits base CPP and EI, has its own Canada employment amount
    // (line 58310), and mirrors the federal BPA phase-down (YT428 line 9).
    credits: {
      payrollContributions: true,
      employmentAmount: { name: "Canada employment amount", maxAmount: 1433 },
      bpaPhaseOut: { minAmount: 14156, start: 173205, end: 246752 },
    },
  },
};
