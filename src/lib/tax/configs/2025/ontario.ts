import { ProvincialTaxConfig, SpendingCategoryConfig } from "../../types";

export const ONTARIO_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Ontario Income Tax",
    brackets: [
      { min: 0, max: 52886, rate: 0.0505 },
      { min: 52886, max: 105775, rate: 0.0915 },
      { min: 105775, max: 150000, rate: 0.1116 },
      { min: 150000, max: 220000, rate: 0.1216 },
      { min: 220000, max: null, rate: 0.1316 },
    ],
    basicPersonalAmount: 12747,
  },
  surtax: {
    type: "surtax",
    name: "Ontario Surtax",
    // 2025 thresholds per CRA T4127 (122nd ed.): 20% of Ontario tax over
    // $5,710 plus 36% of Ontario tax over $7,307.
    tiers: [
      { threshold: 5710, rate: 0.2 },
      { threshold: 7307, rate: 0.36 },
    ],
  },
  healthPremium: {
    type: "healthPremium",
    name: "Ontario Health Premium",
    tiers: [
      { minIncome: 0, maxIncome: 20000, baseAmount: 0, rate: 0, maxAmount: 0 },
      {
        minIncome: 20000,
        maxIncome: 36000,
        baseAmount: 0,
        rate: 0.06,
        maxAmount: 300,
      },
      {
        minIncome: 36000,
        maxIncome: 48000,
        baseAmount: 300,
        rate: 0.06,
        maxAmount: 450,
      },
      {
        minIncome: 48000,
        maxIncome: 72000,
        baseAmount: 450,
        rate: 0.25,
        maxAmount: 600,
      },
      {
        minIncome: 72000,
        maxIncome: 200000,
        baseAmount: 600,
        rate: 0.25,
        maxAmount: 750,
      },
      {
        minIncome: 200000,
        maxIncome: null,
        baseAmount: 750,
        rate: 0.25,
        maxAmount: 900,
      },
    ],
  },
};

// Ontario spending categories (same as 2024 - update when new fiscal data available)
export const ONTARIO_SPENDING: SpendingCategoryConfig[] = [
  { name: "Health", percentage: 40.1 },
  { name: "K-12 Education", percentage: 18.8 },
  { name: "Children, Community and Social Services", percentage: 9.4 },
  { name: "Interest on Debt", percentage: 5.5 },
  { name: "Colleges and Universities", percentage: 6.4 },
  { name: "Transportation", percentage: 3.6 },
  { name: "Energy", percentage: 3.1 },
  { name: "Attorney and Solicitor General", percentage: 2.9 },
  { name: "Infrastructure", percentage: 1.3 },
  { name: "Long-Term Care", percentage: 1.2 },
  { name: "Finance", percentage: 0.9 },
  { name: "Tourism, Culture, and Sport", percentage: 0.9 },
  { name: "Municipal Affairs and Housing", percentage: 0.9 },
  { name: "Labour and Skills Development", percentage: 0.8 },
  { name: "Treasury Board Secretariat", percentage: 0.7 },
  { name: "Economic Development and Trade", percentage: 0.6 },
  { name: "Natural Resources", percentage: 0.5 },
  { name: "Fisheries and Agriculture", percentage: 0.5 },
  { name: "Other", percentage: 1.9 },
];

export const ONTARIO_FEDERAL_TRANSFER_NAME = "Transfer to Ontario";
