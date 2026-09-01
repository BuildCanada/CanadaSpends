import { ProvincialTaxConfig } from "../../types";

// Sources (verified):
// - Income tax brackets & basic personal amount: Revenu Québec — Income Tax Rates
//   https://www.revenuquebec.ca/en/citizens/income-tax-return/completing-your-income-tax-return/income-tax-rates/
// - QPP rate, YMPE, basic exemption, max contribution: Retraite Québec — QPP figures
//   https://www.rrq.gouv.qc.ca/en/programmes/regime_rentes/regime_chiffres/Pages/regime_chiffres.aspx
//   2023: rate 6.40% (5.40% base + 1.00% additional), YMPE $66,600, basic exemption $3,500.
//   Max employee QPP = ($66,600 − $3,500) × 6.40% = $4,038.40.
//   No QPP2 / second additional in 2023 (introduced in 2024).
// - EI (Quebec): Canada.ca — EI premium rates (Quebec rate is reduced because of QPIP)
//   https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/employment-insurance-ei/ei-premium-rates-maximums.html
//   2023 Quebec EI rate 1.27% on max insurable $61,500 → max $781.05.
// - QPIP (employee): Conseil de gestion de l’assurance parentale / Revenu Québec
//   https://www.rqap.gouv.qc.ca/en/about-the-plan/general-information/premiums-and-maximum-insurable-earnings
//   2023: employee rate 0.494%, max insurable $91,000 → max $449.54.

export const QUEBEC_TAX_CONFIG: ProvincialTaxConfig = {
  incomeTax: {
    type: "bracket",
    name: "Quebec Income Tax",
    brackets: [
      { min: 0, max: 49275, rate: 0.14 },
      { min: 49275, max: 98540, rate: 0.19 },
      { min: 98540, max: 119910, rate: 0.24 },
      { min: 119910, max: null, rate: 0.2575 },
    ],
    basicPersonalAmount: 17183,
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
    baseRate: 0.054,
    exemption: 3500,
    maxEarnings: 66600,
    maxContribution: 4038.4,
  },
  // No QPP2 in 2023 — second additional contribution begins in 2024.
  eiOverride: {
    type: "capped",
    name: "Employment Insurance (Quebec)",
    shortName: "EI",
    rate: 0.0127,
    exemption: 0,
    maxEarnings: 61500,
    maxContribution: 781.05,
  },
  parentalInsurance: {
    type: "capped",
    name: "Québec Parental Insurance Plan",
    shortName: "QPIP",
    rate: 0.00494,
    exemption: 0,
    maxEarnings: 91000,
    maxContribution: 449.54,
  },
};
