import { FederalTaxConfig, SpendingCategoryConfig } from "../../types";

export const FEDERAL_TAX_CONFIG: FederalTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Federal Income Tax",
    brackets: [
      { min: 0, max: 58523, rate: 0.14 },
      { min: 58523, max: 117045, rate: 0.205 },
      { min: 117045, max: 181440, rate: 0.26 },
      { min: 181440, max: 258482, rate: 0.29 },
      { min: 258482, max: null, rate: 0.33 },
    ],
    basicPersonalAmount: 16452,
    // Non-refundable credits from income alone (T4127 (January 2026)):
    // - BPA reduced to $14,829 between net incomes $181,440 and $258,482
    // - Base CPP/QPP (line 30800), EI and QPIP premiums (lines 31200, 31205)
    // - Canada employment amount (line 31260): up to $1,501
    // The 2025+ top-up tax credit (line 34990) only applies when credit
    // amounts exceed the first bracket threshold, never for employment
    // income alone.
    credits: {
      payrollContributions: true,
      employmentAmount: { name: "Canada employment amount", maxAmount: 1501 },
      bpaPhaseOut: { minAmount: 14829, start: 181440, end: 258482 },
    },
  },
  ei: {
    type: "capped",
    name: "Employment Insurance",
    shortName: "EI",
    rate: 0.0163,
    exemption: 0,
    maxEarnings: 68900,
    maxContribution: 1123.07,
  },
  cpp: {
    type: "capped",
    name: "Canada Pension Plan",
    shortName: "CPP",
    rate: 0.0595,
    baseRate: 0.0495,
    exemption: 3500,
    maxEarnings: 74600,
    maxContribution: 4230.45,
  },
  cpp2: {
    type: "cpp2",
    name: "CPP Second Additional",
    shortName: "CPP2",
    rate: 0.04,
    ympe: 74600,
    yampe: 85000,
    maxContribution: 416,
  },
};

// Placeholder spending data - can be updated with actual 2026 budget data
export const FEDERAL_SPENDING: SpendingCategoryConfig[] = [
  { name: "Retirement Benefits", percentage: 14.8 },
  { name: "Children, Community and Social Services", percentage: 5.1 },
  { name: "Employment Insurance", percentage: 4.5 },
  { name: "Transfer to Ontario", percentage: 6.02 },
  { name: "Transfer to Alberta", percentage: 2.3 },
  { name: "Transfers to Other Provinces", percentage: 11.18 },
  { name: "Interest on Debt", percentage: 9.2 },
  { name: "Indigenous Priorities", percentage: 8.3 },
  { name: "Defence", percentage: 6.7 },
  { name: "Public Safety", percentage: 4.4 },
  { name: "International Affairs", percentage: 3.7 },
  { name: "Standard of Living", percentage: 12.0 },
  { name: "Health", percentage: 2.7 },
  { name: "Innovation and Research", percentage: 1.8 },
  { name: "Infrastructure", percentage: 1.8 },
  { name: "Transportation", percentage: 1.0 },
  { name: "Natural Resources", percentage: 1.0 },
  { name: "Fisheries and Agriculture", percentage: 1.7 },
  { name: "Environment", percentage: 0.8 },
  { name: "Other", percentage: 1.0 },
];
