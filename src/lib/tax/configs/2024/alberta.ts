import { ProvincialTaxConfig, SpendingCategoryConfig } from "../../types";

export const ALBERTA_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Alberta Income Tax",
    brackets: [
      { min: 0, max: 148269, rate: 0.1 },
      { min: 148269, max: 177922, rate: 0.12 },
      { min: 177922, max: 237230, rate: 0.13 },
      { min: 237230, max: 355845, rate: 0.14 },
      { min: 355845, max: null, rate: 0.15 },
    ],
    basicPersonalAmount: 21885,
    // Credits base CPP contributions and EI premiums at the lowest rate
    credits: {
      payrollContributions: true,
    },
  },
};

export const ALBERTA_SPENDING: SpendingCategoryConfig[] = [
  { name: "Health", percentage: 35.7 },
  { name: "K-12 Education", percentage: 12.6 },
  { name: "Colleges and Universities", percentage: 8.8 },
  { name: "Children, Community and Social Services", percentage: 7.6 },
  { name: "Interest on Debt", percentage: 7.5 },
  { name: "Fisheries and Agriculture", percentage: 3.7 },
  { name: "Transportation", percentage: 2.1 },
  { name: "Public Safety", percentage: 2.1 },
  { name: "Economic Development and Trade", percentage: 2.2 },
  { name: "Energy", percentage: 1.4 },
  { name: "Municipal Affairs and Housing", percentage: 1.4 },
  { name: "Innovation and Research", percentage: 1.0 },
  { name: "Attorney and Solicitor General", percentage: 0.9 },
  { name: "Infrastructure", percentage: 0.7 },
  { name: "Forestry and Parks", percentage: 1.6 },
  { name: "Environment", percentage: 0.5 },
  { name: "Indigenous Priorities", percentage: 0.3 },
  { name: "Tourism, Culture, and Sport", percentage: 0.6 },
  { name: "Other", percentage: 9.3 },
];

export const ALBERTA_FEDERAL_TRANSFER_NAME = "Transfer to Alberta";
