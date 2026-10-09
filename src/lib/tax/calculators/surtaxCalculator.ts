import { SurtaxConfig } from "../types";

/**
 * Calculate Ontario-style surtax (applied to base provincial tax)
 *
 * Unlike income tax brackets, surtax tiers overlap: each tier applies its
 * full rate to ALL basic tax above its own threshold (per form ON428).
 * E.g. Ontario charges 20% of tax over the first threshold PLUS 36% of tax
 * over the second, for a combined 56% marginal surtax above the second.
 */
export interface SurtaxTierAmount {
  threshold: number;
  rate: number;
  amount: number;
}

/** Each surtax tier's amount: its full rate on base tax above its threshold. */
export function getSurtaxBreakdown(
  baseTax: number,
  config: SurtaxConfig,
): SurtaxTierAmount[] {
  return config.tiers.map((tier) => ({
    threshold: tier.threshold,
    rate: tier.rate,
    amount: Math.max(0, baseTax - tier.threshold) * tier.rate,
  }));
}

export function calculateSurtax(baseTax: number, config: SurtaxConfig): number {
  return getSurtaxBreakdown(baseTax, config).reduce(
    (sum, tier) => sum + tier.amount,
    0,
  );
}
