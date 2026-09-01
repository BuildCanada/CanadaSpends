import { CappedContributionConfig } from "../types";

/**
 * Calculate capped contributions (EI, CPP)
 */
export function calculateCappedContribution(
  income: number,
  config: CappedContributionConfig,
): number {
  // Income below exemption = no contribution
  if (income <= config.exemption) {
    return 0;
  }

  // Calculate earnings subject to contribution
  const earningsSubjectToContribution = Math.min(
    income - config.exemption,
    config.maxEarnings - config.exemption,
  );

  // Calculate contribution (capped at max)
  const contribution = earningsSubjectToContribution * config.rate;

  return Math.min(contribution, config.maxContribution);
}

/**
 * Portion of a CPP/QPP contribution attributable to the post-2019 "enhanced"
 * rate (rate - baseRate). This portion is deductible from taxable income on
 * CRA line 22215. Returns 0 when the config has no baseRate.
 */
export function calculateEnhancedContributionPortion(
  contribution: number,
  config: CappedContributionConfig,
): number {
  if (config.baseRate === undefined || config.rate <= 0) {
    return 0;
  }

  const enhancedRate = Math.max(0, config.rate - config.baseRate);
  return contribution * (enhancedRate / config.rate);
}
