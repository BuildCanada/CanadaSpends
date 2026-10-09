import {
  BpaPhaseOutConfig,
  BracketTaxConfig,
  CreditLine,
  TaxReductionConfig,
  TaxReductionLine,
} from "../types";
import { calculateTaxFromBrackets } from "./bracketCalculator";

/**
 * The basic personal amount, reduced linearly between `start` and `end` of
 * net income when it's income-tested (e.g., the federal enhanced BPA).
 */
export function basicPersonalAmountFor(
  netIncome: number,
  maxAmount: number,
  phaseOut?: BpaPhaseOutConfig,
): number {
  if (!phaseOut || netIncome <= phaseOut.start) return maxAmount;
  if (netIncome >= phaseOut.end) return phaseOut.minAmount;
  const share = (netIncome - phaseOut.start) / (phaseOut.end - phaseOut.start);
  return maxAmount - share * (maxAmount - phaseOut.minAmount);
}

export interface IncomeCreditInputs {
  /** Net income (gross employment income less line 22215 deductions) */
  netIncome: number;
  /** Gross employment income */
  employmentIncome: number;
  /**
   * Creditable payroll contributions: base CPP/QPP plus EI and QPIP/PPIP
   * premiums (excluding the enhanced CPP/QPP portion and CPP2/QPP2, which
   * are deducted instead).
   */
  payrollContributions: number;
}

/**
 * Non-refundable credits for one level of government, from income alone.
 * Each credit amount is converted to tax at the lowest bracket rate.
 */
export function calculateIncomeCredits(
  config: BracketTaxConfig,
  inputs: IncomeCreditInputs,
): CreditLine[] {
  const rate = config.brackets[0]?.rate ?? 0;
  const credits = config.credits;
  const lines: CreditLine[] = [];
  const add = (id: CreditLine["id"], name: string, amount: number) => {
    if (amount > 0) lines.push({ id, name, amount, value: amount * rate });
  };

  add(
    "basicPersonalAmount",
    "Basic personal amount",
    basicPersonalAmountFor(
      inputs.netIncome,
      config.basicPersonalAmount,
      credits?.bpaPhaseOut,
    ),
  );
  if (credits?.payrollContributions) {
    add(
      "payrollContributions",
      "CPP/QPP and EI contributions",
      inputs.payrollContributions,
    );
  }
  if (credits?.employmentAmount) {
    add(
      "employmentAmount",
      credits.employmentAmount.name,
      Math.min(inputs.employmentIncome, credits.employmentAmount.maxAmount),
    );
  }
  return lines;
}

export interface IncomeTaxResult {
  /** Tax on taxable income from the brackets, before credits */
  taxBeforeCredits: number;
  credits: CreditLine[];
  /** Tax after non-refundable credits (never below zero) */
  tax: number;
}

/**
 * Bracket tax on taxable income, less non-refundable credits.
 */
export function calculateIncomeTax(
  taxableIncome: number,
  config: BracketTaxConfig,
  inputs: IncomeCreditInputs,
): IncomeTaxResult {
  const taxBeforeCredits = calculateTaxFromBrackets(
    taxableIncome,
    config.brackets,
  );
  const credits = calculateIncomeCredits(config, inputs);
  const totalCredits = credits.reduce((sum, c) => sum + c.value, 0);
  return {
    taxBeforeCredits,
    credits,
    tax: Math.max(0, taxBeforeCredits - totalCredits),
  };
}

/**
 * Apply provincial low-income reductions in order. Each is non-refundable,
 * so together they can only reduce `provincialTax` to zero.
 */
export function calculateTaxReductions(
  provincialTax: number,
  reductions: TaxReductionConfig[] | undefined,
  inputs: Pick<IncomeCreditInputs, "netIncome" | "employmentIncome">,
): TaxReductionLine[] {
  const lines: TaxReductionLine[] = [];
  let remaining = Math.max(0, provincialTax);

  for (const reduction of reductions ?? []) {
    let credit: number;
    if (reduction.type === "phaseOut") {
      const max =
        reduction.maxRateOfEmploymentIncome !== undefined
          ? Math.min(
              reduction.maxCredit,
              inputs.employmentIncome * reduction.maxRateOfEmploymentIncome,
            )
          : reduction.maxCredit;
      credit = Math.max(
        0,
        max -
          Math.max(0, inputs.netIncome - reduction.threshold) *
            reduction.reductionRate,
      );
    } else {
      credit = Math.max(
        0,
        reduction.multiplier * reduction.basicAmount - remaining,
      );
    }
    const applied = Math.min(credit, remaining);
    if (applied > 0) {
      lines.push({ id: reduction.id, name: reduction.name, amount: applied });
      remaining -= applied;
    }
  }
  return lines;
}
