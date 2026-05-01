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
