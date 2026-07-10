import { ProvincialTaxConfig } from "../../types";

// Sources (verified):
// - Income tax brackets & basic personal amount: Revenu Québec — Income Tax Rates
//   https://www.revenuquebec.ca/en/citizens/income-tax-return/completing-your-income-tax-return/income-tax-rates/
// - QPP rate, YMPE, basic exemption, max contribution: Revenu Québec / Retraite Québec
//   https://www.revenuquebec.ca/en/businesses/source-deductions-and-employer-contributions/calculating-source-deductions-and-employer-contributions/quebec-pension-plan-contributions/maximum-pensionable-salary-or-wages-and-contribution-rate/
//   2025: rate 6.40%, YMPE $71,300, basic exemption $3,500.
//   Max employee QPP1 = ($71,300 − $3,500) × 6.40% = $4,339.20.
// - QPP2 (second additional): 2025 rate 4% on earnings between YMPE $71,300 and
//   YAMPE $81,200 (114% of YMPE). Max employee QPP2 = ($81,200 − $71,300) × 4% = $396.00.
// - EI (Quebec): Canada.ca — EI premium rates 2025 (Quebec reduced due to QPIP)
//   https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/employment-insurance-ei/ei-premium-rates-maximums.html
//   2025 Quebec EI rate 1.31% on max insurable $65,700 → max $860.67.
// - QPIP (employee): Conseil de gestion de l’assurance parentale
//   https://www.rqap.gouv.qc.ca/en/about-the-plan/general-information/premiums-and-maximum-insurable-earnings
//   2025: employee rate 0.494%, max insurable $98,000 → max $484.12.

export const QUEBEC_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Quebec Income Tax",
    brackets: [
      { min: 0, max: 53255, rate: 0.14 },
      { min: 53255, max: 106495, rate: 0.19 },
      { min: 106495, max: 129590, rate: 0.24 },
      { min: 129590, max: null, rate: 0.2575 },
    ],
    basicPersonalAmount: 18571,
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
    maxEarnings: 71300,
    maxContribution: 4339.2,
  },
  pensionPlanAdditionalOverride: {
    type: "cpp2",
    name: "QPP Second Additional",
    shortName: "QPP2",
    rate: 0.04,
    ympe: 71300,
    yampe: 81200,
    maxContribution: 396,
  },
  eiOverride: {
    type: "capped",
    name: "Employment Insurance (Quebec)",
    shortName: "EI",
    rate: 0.0131,
    exemption: 0,
    maxEarnings: 65700,
    maxContribution: 860.67,
  },
  parentalInsurance: {
    type: "capped",
    name: "Québec Parental Insurance Plan",
    shortName: "QPIP",
    rate: 0.00494,
    exemption: 0,
    maxEarnings: 98000,
    maxContribution: 484.12,
  },
};
