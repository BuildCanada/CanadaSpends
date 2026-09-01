// Main exports
export {
  calculateDetailedTax,
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
