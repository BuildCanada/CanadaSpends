import { FederalTaxConfig, SpendingCategoryConfig } from "../../types";

export const FEDERAL_TAX_CONFIG: FederalTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Federal Income Tax",
    brackets: [
      { min: 0, max: 53359, rate: 0.15 },
      { min: 53359, max: 106717, rate: 0.205 },
      { min: 106717, max: 165430, rate: 0.26 },
      { min: 165430, max: 235675, rate: 0.29 },
      { min: 235675, max: null, rate: 0.33 },
    ],
    basicPersonalAmount: 15000,
  },
  ei: {
    type: "capped",
    name: "Employment Insurance",
    shortName: "EI",
    rate: 0.0163,
    exemption: 0,
    maxEarnings: 61500,
    maxContribution: 1002.45,
  },
  cpp: {
    type: "capped",
    name: "Canada Pension Plan",
    shortName: "CPP",
    rate: 0.0595,
    baseRate: 0.0495,
    exemption: 3500,
    maxEarnings: 66600,
    maxContribution: 3754.45,
  },
  cpp2: {
    type: "cpp2",
    name: "CPP Second Additional",
    shortName: "CPP2",
    rate: 0,
    ympe: 66600,
    yampe: 66600,
    maxContribution: 0,
  },
};

// Placeholder spending data - can be updated with actual 2023 budget data
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
