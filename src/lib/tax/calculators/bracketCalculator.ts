import { TaxBracket } from "../types";

/**
 * Per-bracket tax breakdown result
 */
export interface BracketTaxBreakdown {
  bracket: TaxBracket;
  taxableAmount: number;
  taxAmount: number;
}

/**
 * Calculate tax from progressive brackets
 */
export function calculateTaxFromBrackets(
  income: number,
  brackets: TaxBracket[],
): number {
  let tax = 0;

  for (const bracket of brackets) {
    if (income <= bracket.min) {
      break;
    }

    const taxableInThisBracket = Math.min(
      income - bracket.min,
      bracket.max ? bracket.max - bracket.min : income - bracket.min,
    );

    tax += taxableInThisBracket * bracket.rate;
  }

  return tax;
}

/**
 * Get per-bracket breakdown of tax
 */
export function getBracketTaxBreakdown(
  income: number,
  brackets: TaxBracket[],
): BracketTaxBreakdown[] {
  const breakdown: BracketTaxBreakdown[] = [];

  for (const bracket of brackets) {
    if (income <= bracket.min) {
      // No income in this bracket
      breakdown.push({
        bracket,
        taxableAmount: 0,
        taxAmount: 0,
      });
    } else {
      const taxableInThisBracket = Math.min(
        income - bracket.min,
        bracket.max ? bracket.max - bracket.min : income - bracket.min,
      );

      breakdown.push({
        bracket,
        taxableAmount: taxableInThisBracket,
        taxAmount: taxableInThisBracket * bracket.rate,
      });
    }
  }

  return breakdown;
}
