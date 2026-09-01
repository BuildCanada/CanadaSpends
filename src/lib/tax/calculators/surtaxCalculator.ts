import { SurtaxConfig } from "../types";

/**
 * Calculate Ontario-style surtax (applied to base provincial tax)
 *
 * Unlike income tax brackets, surtax tiers overlap: each tier applies its
 * full rate to ALL basic tax above its own threshold (per form ON428).
 * E.g. Ontario charges 20% of tax over the first threshold PLUS 36% of tax
 * over the second, for a combined 56% marginal surtax above the second.
 */
export function calculateSurtax(baseTax: number, config: SurtaxConfig): number {
  let surtax = 0;

  for (const tier of config.tiers) {
    surtax += Math.max(0, baseTax - tier.threshold) * tier.rate;
  }

  return surtax;
}
