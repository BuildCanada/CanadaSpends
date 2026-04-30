import { ProvincialTaxConfig } from "../../types";

// Sources (verified):
// - Income tax brackets & basic personal amount: Revenu Québec — Income Tax Rates
//   https://www.revenuquebec.ca/en/citizens/income-tax-return/completing-your-income-tax-return/income-tax-rates/
// - QPP YMPE / YAMPE 2026: Retraite Québec / SAI publications
//   https://saiinc.ca/en/publications/news/quebec-pension-plan-key-data-2026
//   2026: rate 6.40%, YMPE $74,600, basic exemption $3,500.
//   Max employee QPP1 = ($74,600 − $3,500) × 6.40% = $4,550.40.
// - QPP2 (second additional): 2026 rate 4% on earnings between YMPE $74,600 and
//   YAMPE $85,000 (114% of YMPE). Max employee QPP2 = ($85,000 − $74,600) × 4% = $416.00.
// - EI (Quebec) 2026: Canada.ca — EI premium rates 2026 (Quebec reduced rate)
//   https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/employment-insurance-ei/ei-premium-rates-maximums.html
//   2026 Quebec EI rate 1.30% on max insurable $68,900 → max $895.70.
// - QPIP (employee) 2026: Conseil de gestion de l’assurance parentale
//   https://www.rqap.gouv.qc.ca/en/news/reduction-in-premium-rates-for-the-quebec-parental-insurance-plan-in-2026
//   2026: employee rate 0.455%, max insurable $103,000 → max $468.65.

export const QUEBEC_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Quebec Income Tax",
    brackets: [
      { min: 0, max: 54345, rate: 0.14 },
      { min: 54345, max: 108680, rate: 0.19 },
      { min: 108680, max: 132245, rate: 0.24 },
      { min: 132245, max: null, rate: 0.2575 },
    ],
    basicPersonalAmount: 18952,
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
    maxEarnings: 74600,
    maxContribution: 4550.4,
  },
  pensionPlanAdditionalOverride: {
    type: "cpp2",
    name: "QPP Second Additional",
    shortName: "QPP2",
    rate: 0.04,
    ympe: 74600,
    yampe: 85000,
    maxContribution: 416,
  },
  eiOverride: {
    type: "capped",
    name: "Employment Insurance (Quebec)",
    shortName: "EI",
    rate: 0.013,
    exemption: 0,
    maxEarnings: 68900,
    maxContribution: 895.7,
  },
  parentalInsurance: {
    type: "capped",
    name: "Québec Parental Insurance Plan",
    shortName: "QPIP",
    rate: 0.00455,
    exemption: 0,
    maxEarnings: 103000,
    maxContribution: 468.65,
  },
};
