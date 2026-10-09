// Main exports
export {
  calculateDetailedTax,
  calculateTaxWithConfig,
  calculateTotalTax,
  formatCurrency,
  formatPercentage,
} from "./calculator";

// Config exports
export {
  config2024,
  config2025,
  getDefaultYear,
  getSpendingConfig,
  getSupportedProvinces,
  getSupportedYears,
  getTaxConfig,
  isProvinceSupported,
  isYearSupported,
} from "./configs";

// Type exports
export type {
  BracketTaxConfig,
  CappedContributionConfig,
  DetailedTaxCalculation,
  FederalTaxConfig,
  HealthPremiumConfig,
  HealthPremiumTier,
  ProvincialTaxConfig,
  SpendingCategoryConfig,
  SpendingConfig,
  SupportedProvince,
  SupportedYear,
  SurtaxConfig,
  SurtaxTier,
  TaxBracket,
  TaxCalculation,
  TaxLineItem,
  TaxYearProvinceConfig,
} from "./types";

// Calculator function exports (for direct use)
export {
  calculateBracketTax,
  calculateCappedContribution,
  calculateCpp2Contribution,
  calculateEnhancedContributionPortion,
  calculateHealthPremium,
  calculateSurtax,
  calculateTaxFromBrackets,
  getBracketTaxBreakdown,
} from "./calculators";
export type { BracketTaxBreakdown } from "./calculators";

// Scenario (what-if simulator) exports
export {
  applyPlan,
  buildRateCurve,
  chartMaxIncome,
  CODE_TO_PROVINCE,
  compareScenario,
  createDefaultScenario,
  createPlan,
  decodeBrackets,
  describeComparison,
  effectivePlan,
  encodeBrackets,
  formatWholeDollars,
  isProposal,
  MAX_PLANS,
  MAX_SCENARIO_BRACKETS,
  MAX_SCENARIO_INCOME,
  normalizeScenario,
  normalizeBrackets,
  parseScenario,
  percentToRate,
  PLAN_KEYS,
  planHasChanges,
  planLabel,
  planOverrideParams,
  plansEquivalent,
  PROVINCE_NAMES,
  PROVINCE_TO_CODE,
  rateToPercent,
  SCENARIO_YEAR,
  scenarioTitle,
  scenarioHasChanges,
  serializeScenario,
} from "./scenario";
export type {
  PlanResult,
  RateCurvePoint,
  ScenarioComparison,
  TaxPlan,
  TaxScenario,
} from "./scenario";
