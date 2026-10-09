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
  compareScenario,
  createDefaultScenario,
  createPlan,
  decodeBrackets,
  defaultScenarioTitle,
  describeComparison,
  encodeBrackets,
  formatWholeDollars,
  MAX_PLAN_NAME_LENGTH,
  MAX_PLANS,
  MAX_SCENARIO_BRACKETS,
  MAX_SCENARIO_TITLE_LENGTH,
  normalizeBrackets,
  parseScenario,
  PLAN_KEYS,
  planHasChanges,
  planLabel,
  plansEquivalent,
  PROVINCE_NAMES,
  PROVINCE_TO_CODE,
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
