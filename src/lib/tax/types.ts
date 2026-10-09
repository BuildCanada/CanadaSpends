// Tax bracket configuration for progressive income tax
export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

// Progressive bracket tax config (federal/provincial income tax)
export interface BracketTaxConfig {
  type: "bracket";
  name: string;
  brackets: TaxBracket[];
  basicPersonalAmount: number;
  // Non-refundable credits beyond the basic personal amount that depend only
  // on income. Converted to tax at the lowest bracket rate.
  credits?: IncomeCreditsConfig;
}

// Income-tested basic personal amount: the full BPA up to `start`, reduced
// linearly to `minAmount` at `end` (e.g., the federal enhanced BPA, which is
// clawed back between the 4th and 5th bracket thresholds).
export interface BpaPhaseOutConfig {
  minAmount: number;
  start: number;
  end: number;
}

// Non-refundable credit amounts that can be computed from income alone
// (a single person under 65 with only employment income).
export interface IncomeCreditsConfig {
  // Credit for base CPP/QPP contributions (CRA line 30800) and EI premiums
  // (line 31200), plus QPIP/PPIP premiums where they apply. The enhanced
  // CPP/QPP portion and CPP2/QPP2 are deducted at line 22215 instead.
  payrollContributions?: boolean;
  // Canada employment amount (line 31260) or a provincial/territorial
  // equivalent: the lesser of employment income and `maxAmount`.
  employmentAmount?: { name: string; maxAmount: number };
  bpaPhaseOut?: BpaPhaseOutConfig;
}

// A non-refundable credit as applied to one level of government
export interface CreditLine {
  id: "basicPersonalAmount" | "payrollContributions" | "employmentAmount";
  name: string;
  // The credit amount (e.g., the BPA in dollars)
  amount: number;
  // Its value against tax: amount × the lowest bracket rate
  value: number;
}

// Capped contribution config (EI, CPP)
export interface CappedContributionConfig {
  type: "capped";
  name: string;
  shortName: string;
  rate: number;
  exemption: number;
  maxEarnings: number;
  maxContribution: number;
  // For CPP/QPP: the historical "base" rate (pre-2019 enhancement). The
  // portion of the contribution attributable to (rate - baseRate) is the
  // "enhanced" CPP/QPP contribution and is deductible from taxable income
  // on CRA line 22215. If unset, no enhanced deduction is computed.
  baseRate?: number;
}

// Surtax config (Ontario surtax - tiers applied to base tax)
export interface SurtaxTier {
  threshold: number;
  rate: number;
}

export interface SurtaxConfig {
  type: "surtax";
  name: string;
  tiers: SurtaxTier[];
}

// Health premium config (Ontario health premium - complex tiers)
export interface HealthPremiumTier {
  minIncome: number;
  maxIncome: number | null;
  baseAmount: number;
  rate: number;
  maxAmount: number;
}

export interface HealthPremiumConfig {
  type: "healthPremium";
  name: string;
  tiers: HealthPremiumTier[];
}

// Spending category for budget breakdown
export interface SpendingCategoryConfig {
  name: string;
  percentage: number;
}

// CPP2 (second additional CPP) config - applies to earnings between YMPE and YAMPE
export interface Cpp2Config {
  type: "cpp2";
  name: string;
  shortName: string;
  rate: number;
  ympe: number; // Year's Maximum Pensionable Earnings (lower threshold)
  yampe: number; // Year's Additional Maximum Pensionable Earnings (upper threshold)
  maxContribution: number;
}

// Federal tax configuration
export interface FederalTaxConfig {
  incomeTax: BracketTaxConfig;
  ei: CappedContributionConfig;
  cpp: CappedContributionConfig;
  cpp2: Cpp2Config;
}

// Federal abatement config (Quebec Abatement - reduces federal tax for Quebec residents)
export interface FederalAbatementConfig {
  type: "federalAbatement";
  name: string;
  rate: number; // e.g., 0.165 for 16.5%
}

// Low-income reduction of provincial tax, applied after non-refundable
// credits and surtaxes. It can only reduce provincial tax to zero.
export type TaxReductionConfig =
  // A maximum credit reduced by a percentage of net income above a
  // threshold (e.g., the BC tax reduction credit, Ontario LIFT credit).
  // `maxRateOfEmploymentIncome` caps the credit at a percentage of
  // employment income (Ontario LIFT: 5.05%).
  | {
      type: "phaseOut";
      id: string;
      name: string;
      maxCredit: number;
      threshold: number;
      reductionRate: number;
      maxRateOfEmploymentIncome?: number;
    }
  // Ontario Tax Reduction: (multiplier × basic amount) − provincial tax.
  | {
      type: "taxOffset";
      id: string;
      name: string;
      basicAmount: number;
      multiplier: number;
    };

export interface TaxReductionLine {
  id: string;
  name: string;
  amount: number;
}

// Provincial tax configuration
export interface ProvincialTaxConfig {
  incomeTax: BracketTaxConfig;
  surtax?: SurtaxConfig;
  healthPremium?: HealthPremiumConfig;
  federalAbatement?: FederalAbatementConfig;
  // Low-income tax reductions, applied in order after credits and surtax
  taxReductions?: TaxReductionConfig[];
  // A deduction from provincial taxable income only, as a share of
  // employment income up to a maximum (e.g., Quebec's deduction for
  // workers: 6% up to an indexed cap)
  employmentDeduction?: { name: string; rate: number; maxAmount: number };
  // Province-specific pension plan that replaces the federal CPP
  // (e.g., Quebec residents pay QPP instead of CPP).
  pensionPlanOverride?: CappedContributionConfig;
  // Province-specific second additional pension plan that replaces CPP2
  // (e.g., Quebec QPP2).
  pensionPlanAdditionalOverride?: Cpp2Config;
  // Province-specific Employment Insurance rate that replaces the federal
  // EI rate (Quebec residents pay a reduced EI rate because the province
  // administers its own parental insurance plan via QPIP).
  eiOverride?: CappedContributionConfig;
  // Province-administered parental insurance plan (e.g., Quebec QPIP).
  parentalInsurance?: CappedContributionConfig;
}

// Spending data for a province
export interface SpendingConfig {
  federal: SpendingCategoryConfig[];
  provincial: SpendingCategoryConfig[];
  federalTransferName: string;
}

// Complete tax configuration for a year/province combination
export interface TaxYearProvinceConfig {
  year: string;
  province: string;
  federal: FederalTaxConfig;
  provincial: ProvincialTaxConfig;
  spending?: SpendingConfig;
}

// Tax line item for detailed breakdown
export interface TaxLineItem {
  id: string;
  name: string;
  level: "federal" | "provincial";
  amount: number;
  effectiveRate: number;
  category:
    | "incomeTax"
    | "ei"
    | "cpp"
    | "cpp2"
    | "surtax"
    | "healthPremium"
    | "incomeTaxProvincial"
    | "federalAbatement"
    | "taxReduction"
    | "parentalInsurance";
}

// Detailed calculation result
export interface DetailedTaxCalculation {
  // Summary (backwards compatible with TaxCalculation)
  grossIncome: number;
  federalTax: number;
  provincialTax: number;
  totalTax: number;
  netIncome: number;
  effectiveTaxRate: number;

  // Line items for accordion breakdown
  lineItems: TaxLineItem[];

  // Individual totals
  federalIncomeTax: number;
  provincialIncomeTax: number;
  eiContribution: number;
  cppContribution: number;
  cpp2Contribution: number;
  parentalInsuranceContribution: number;
  surtax: number;
  healthPremium: number;
  federalAbatement: number;
  cppQppEnhancedDeduction: number;

  // Income tax before non-refundable credits, the credits applied, and
  // provincial low-income reductions (all positive amounts)
  federalIncomeTaxBeforeCredits: number;
  provincialIncomeTaxBeforeCredits: number;
  federalCredits: CreditLine[];
  provincialCredits: CreditLine[];
  // Provincial-only deduction (e.g., Quebec deduction for workers) and the
  // resulting provincial taxable income
  provincialEmploymentDeduction: number;
  provincialTaxableIncome: number;
  provincialTaxReductions: TaxReductionLine[];
  provincialTaxReduction: number;

  // Metadata
  year: string;
  province: string;
}

// Backwards compatible interface (matches old TaxCalculation)
export interface TaxCalculation {
  grossIncome: number;
  federalTax: number;
  provincialTax: number;
  totalTax: number;
  netIncome: number;
  effectiveTaxRate: number;
}

// Supported provinces
export type SupportedProvince =
  | "ontario"
  | "alberta"
  | "british-columbia"
  | "saskatchewan"
  | "manitoba"
  | "new-brunswick"
  | "nova-scotia"
  | "prince-edward-island"
  | "newfoundland-and-labrador"
  | "quebec"
  | "yukon"
  | "northwest-territories"
  | "nunavut";

// Supported years
export type SupportedYear = "2023" | "2024" | "2025" | "2026";
