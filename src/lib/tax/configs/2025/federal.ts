import { FederalTaxConfig, SpendingCategoryConfig } from "../../types";

export const FEDERAL_TAX_CONFIG: FederalTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Federal Income Tax",
    brackets: [
      { min: 0, max: 57375, rate: 0.145 },
      { min: 57375, max: 114750, rate: 0.205 },
      { min: 114750, max: 177882, rate: 0.26 },
      { min: 177882, max: 253414, rate: 0.29 },
      { min: 253414, max: null, rate: 0.33 },
    ],
    basicPersonalAmount: 16129,
    // Non-refundable credits from income alone (Federal Worksheet 5000-D1 (2025)):
    // - BPA reduced to $14,538 between net incomes $177,882 and $253,414
    // - Base CPP/QPP (line 30800), EI and QPIP premiums (lines 31200, 31205)
    // - Canada employment amount (line 31260): up to $1,471
    // The 2025+ top-up tax credit (line 34990) only applies when credit
    // amounts exceed the first bracket threshold, never for employment
    // income alone.
    credits: {
      payrollContributions: true,
      employmentAmount: { name: "Canada employment amount", maxAmount: 1471 },
      bpaPhaseOut: { minAmount: 14538, start: 177882, end: 253414 },
    },
  },
  ei: {
    type: "capped",
    name: "Employment Insurance",
    shortName: "EI",
    rate: 0.0164,
    exemption: 0,
    maxEarnings: 65700,
    maxContribution: 1077.48,
  },
  cpp: {
    type: "capped",
    name: "Canada Pension Plan",
    shortName: "CPP",
    rate: 0.0595,
    baseRate: 0.0495,
    exemption: 3500,
    maxEarnings: 71300,
    maxContribution: 4034.1,
  },
  cpp2: {
    type: "cpp2",
    name: "CPP Second Additional",
    shortName: "CPP2",
    rate: 0.04,
    ympe: 71300,
    yampe: 81200,
    maxContribution: 396,
  },
};

// Federal spending categories (same as 2024 - update when new fiscal data available)
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
  {
    name: "Standard of Living, including training, carbon tax rebate, and other supports",
    percentage: 12.0,
  },
  { name: "Health", percentage: 2.7 },
  { name: "Innovation and Research", percentage: 1.8 },
  { name: "Infrastructure", percentage: 1.8 },
  { name: "Transportation", percentage: 1.0 },
  { name: "Natural Resources", percentage: 1.0 },
  { name: "Fisheries and Agriculture", percentage: 1.7 },
  { name: "Environment", percentage: 0.8 },
  { name: "Other", percentage: 1.0 },
];
