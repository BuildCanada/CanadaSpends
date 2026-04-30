import { ProvincialTaxConfig } from "../../types";

// Sources (verified):
// - Income tax brackets & basic personal amount: Revenu Québec — Income Tax Rates
//   https://www.revenuquebec.ca/en/citizens/income-tax-return/completing-your-income-tax-return/income-tax-rates/
// - QPP rate, YMPE, basic exemption, max contribution: Retraite Québec / Revenu Québec
//   https://www.revenuquebec.ca/en/businesses/source-deductions-and-employer-contributions/calculating-source-deductions-and-employer-contributions/quebec-pension-plan-contributions/maximum-pensionable-salary-or-wages-and-contribution-rate/
//   2024: rate 6.40%, YMPE $68,500, basic exemption $3,500.
//   Max employee QPP1 = ($68,500 − $3,500) × 6.40% = $4,160.00.
// - QPP2 (second additional): introduced in 2024.
//   2024: rate 4%, YMPE $68,500, YAMPE $73,200 (107% of YMPE).
//   Max employee QPP2 = ($73,200 − $68,500) × 4% = $188.00.
// - EI (Quebec): Canada.ca — EI premium rates (Quebec rate reduced due to QPIP)
//   https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/employment-insurance-ei/ei-premium-rates-maximums.html
//   2024 Quebec EI rate 1.32% on max insurable $63,200 → max $834.24.
// - QPIP (employee): Conseil de gestion de l’assurance parentale
//   https://www.rqap.gouv.qc.ca/en/about-the-plan/general-information/premiums-and-maximum-insurable-earnings
//   2024: employee rate 0.494%, max insurable $94,000 → max $464.36.

export const QUEBEC_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Quebec Income Tax",
    brackets: [
      { min: 0, max: 51780, rate: 0.14 },
      { min: 51780, max: 103545, rate: 0.19 },
      { min: 103545, max: 126000, rate: 0.24 },
      { min: 126000, max: null, rate: 0.2575 },
    ],
    basicPersonalAmount: 18056,
  },
  federalAbatement: {
    type: "federalAbatement",
    name: "Quebec Abatement",
    rate: 0.165, // 16.5% reduction in federal income tax
  },
  pensionPlanOverride: {
    type: "capped",
    name: "Québec Pension Plan",
    shortName: "QPP",
    rate: 0.064,
    exemption: 3500,
    maxEarnings: 68500,
    maxContribution: 4160,
  },
  pensionPlanAdditionalOverride: {
    type: "cpp2",
    name: "QPP Second Additional",
    shortName: "QPP2",
    rate: 0.04,
    ympe: 68500,
    yampe: 73200,
    maxContribution: 188,
  },
  eiOverride: {
    type: "capped",
    name: "Employment Insurance (Quebec)",
    shortName: "EI",
    rate: 0.0132,
    exemption: 0,
    maxEarnings: 63200,
    maxContribution: 834.24,
  },
  parentalInsurance: {
    type: "capped",
    name: "Québec Parental Insurance Plan",
    shortName: "QPIP",
    rate: 0.00494,
    exemption: 0,
    maxEarnings: 94000,
    maxContribution: 464.36,
  },
};
