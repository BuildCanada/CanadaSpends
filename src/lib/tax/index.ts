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
  BpaPhaseOutConfig,
  BracketTaxConfig,
  CappedContributionConfig,
  CreditLine,
  DetailedTaxCalculation,
  FederalTaxConfig,
  HealthPremiumConfig,
  HealthPremiumTier,
  IncomeCreditsConfig,
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
  TaxReductionConfig,
  TaxReductionLine,
  TaxYearProvinceConfig,
} from "./types";

// Calculator function exports (for direct use)
export {
  basicPersonalAmountFor,
  calculateBracketTax,
  calculateCappedContribution,
  calculateCpp2Contribution,
  calculateEnhancedContributionPortion,
  calculateHealthPremium,
  calculateIncomeCredits,
  calculateIncomeTax,
  calculateSurtax,
  calculateTaxFromBrackets,
  calculateTaxReductions,
  getBracketTaxBreakdown,
} from "./calculators";
export type { BracketTaxBreakdown } from "./calculators";
