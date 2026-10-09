import { ProvincialTaxConfig } from "../../types";

export const YUKON_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Yukon Income Tax",
    brackets: [
      { min: 0, max: 53359, rate: 0.064 },
      { min: 53359, max: 106717, rate: 0.09 },
      { min: 106717, max: 165430, rate: 0.109 },
      { min: 165430, max: 500000, rate: 0.128 },
      { min: 500000, max: null, rate: 0.15 },
    ],
    basicPersonalAmount: 15000,
    // Yukon credits base CPP and EI, has its own Canada employment amount
    // (line 58310), and mirrors the federal BPA phase-down (YT428 line 9).
    credits: {
      payrollContributions: true,
      employmentAmount: { name: "Canada employment amount", maxAmount: 1368 },
      bpaPhaseOut: { minAmount: 13520, start: 165430, end: 235675 },
    },
  },
};
