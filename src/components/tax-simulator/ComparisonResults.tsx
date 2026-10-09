"use client";

import { useEffect, useMemo, useState } from "react";
import { Trans, useLingui } from "@lingui/react/macro";
import { toast } from "sonner";

import {
  buildRateCurve,
  calculateTaxWithConfig,
  chartMaxIncome,
  formatWholeDollars,
  PROVINCE_NAMES,
  type DetailedTaxCalculation,
  type ScenarioComparison,
} from "@/lib/tax";
import { cn } from "@/lib/utils";

import { planColor } from "./planColors";
import { TaxPaidChart } from "./TaxPaidChart";

const SAMPLE_INCOMES = [30000, 50000, 75000, 100000, 150000, 250000, 500000];

export function signedDollars(amount: number) {
  const rounded = Math.round(amount);
  if (rounded === 0) return formatWholeDollars(0);
  return `${rounded > 0 ? "+" : "−"}${formatWholeDollars(Math.abs(rounded))}`;
}

export function deltaClass(amount: number) {
  const rounded = Math.round(amount);
  if (rounded < 0) return "text-pine-700";
  if (rounded > 0) return "text-auburn-700";
  return "text-foreground/60";
}

function PlanSwatch({ index }: { index: number }) {
  return (
    <span
      aria-hidden
      className="inline-block h-1 w-5 shrink-0 rounded-full"
      style={
        index === 0
          ? {
              backgroundImage: `repeating-linear-gradient(90deg, ${planColor(0)} 0 5px, transparent 5px 8px)`,
            }
          : { background: planColor(index) }
      }
    />
  );
}

function PlanSubtitle({
  province,
  year,
  changed,
}: {
  province: string;
  year: string;
  changed: boolean;
}) {
  const provinceName = PROVINCE_NAMES[province] ?? province;
  return (
    <div className="text-xs text-foreground/50 truncate">
      {changed ? (
        <Trans>
          {provinceName} {year}, modified
        </Trans>
      ) : (
        <Trans>
          {provinceName} {year} law
        </Trans>
      )}
    </div>
  );
}

/** Headline numbers: one card per plan, with the difference vs. plan A. */
export function ResultsSummary({
  comparison,
  income,
  changedFlags,
}: {
  comparison: ScenarioComparison;
  income: number;
  changedFlags: boolean[];
}) {
  const { plans, reference } = comparison;
  return (
    <div className="@container">
      <div className="text-sm text-foreground/60 mb-3">
        <Trans>Total tax at {formatWholeDollars(income)} income</Trans>
      </div>
      <div
        className={cn(
          "grid gap-3",
          // Sized by the container (the editor's results column is narrower
          // than the view page) so amounts never overflow their cards
          plans.length === 2 && "grid-cols-2",
          plans.length === 3 && "grid-cols-2 @2xl:grid-cols-3",
          plans.length === 4 && "grid-cols-2 @3xl:grid-cols-4",
        )}
      >
        {plans.map((p, i) => (
          <div
            key={i}
            className="rounded-md border border-border bg-background/60 p-3 min-w-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <PlanSwatch index={i} />
              <span className="font-medium text-sm truncate">{p.label}</span>
            </div>
            <PlanSubtitle
              province={p.plan.province}
              year={p.plan.year}
              changed={changedFlags[i]}
            />
            <div className="text-2xl font-bold font-display tabular-nums whitespace-nowrap mt-2">
              {formatWholeDollars(p.result.totalTax)}
            </div>
            <div className="text-xs text-foreground/60">
              <Trans>{p.result.effectiveTaxRate.toFixed(1)}% effective</Trans>
            </div>
            {i > 0 && (
              <div
                className={cn(
                  "mt-2 text-sm font-semibold tabular-nums",
                  deltaClass(p.difference),
                )}
              >
                {Math.round(p.difference) === 0 ? (
                  <Trans>Same as {reference.label}</Trans>
                ) : (
                  <Trans>
                    {signedDollars(p.difference)}{" "}
                    <span className="font-normal">vs {reference.label}</span>
                  </Trans>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TaxChartSection({
  comparison,
  income,
}: {
  comparison: ScenarioComparison;
  income: number;
}) {
  const maxIncome = chartMaxIncome(income);
  const curve = useMemo(
    () => buildRateCurve(comparison, maxIncome, 100),
    [comparison, maxIncome],
  );
  return (
    <div>
      <TaxPaidChart
        points={curve}
        labels={comparison.plans.map((p) => p.label)}
        maxIncome={maxIncome}
        income={income}
      />
      {comparison.plans.length > 1 && (
        <div className="mt-6">
          <TaxPaidChart
            mode="difference"
            points={curve}
            labels={comparison.plans.map((p) => p.label)}
            maxIncome={maxIncome}
            income={income}
          />
        </div>
      )}
      <p className="text-xs text-foreground/50 mt-2">
        <Trans>
          Total tax paid (income tax, CPP/QPP, EI and premiums) by employment
          income, and how much more or less each plan charges than{" "}
          {comparison.reference.label}. The dotted line marks the selected
          income.
        </Trans>
      </p>
    </div>
  );
}

function PlanHeaderCell({ label, index }: { label: string; index: number }) {
  return (
    <th className="pb-2 font-medium text-right align-bottom">
      <span className="inline-flex items-center gap-1.5 justify-end">
        <PlanSwatch index={index} />
        <span className="truncate max-w-32">{label}</span>
      </span>
    </th>
  );
}

/** Total tax under each plan at a range of incomes. */
export function IncomeTable({
  comparison,
}: {
  comparison: ScenarioComparison;
}) {
  const rows = useMemo(
    () =>
      SAMPLE_INCOMES.map((income) => ({
        income,
        results: comparison.plans.map((p) =>
          calculateTaxWithConfig(income, p.config),
        ),
      })),
    [comparison],
  );

  return (
    <div className="bg-card rounded-lg border p-5 overflow-x-auto">
      <h3 className="font-bold text-lg mb-1">
        <Trans>Who pays more, who pays less</Trans>
      </h3>
      <p className="text-sm text-foreground/60 mb-4">
        <Trans>
          Total tax at different incomes, with the change compared to{" "}
          {comparison.reference.label}
        </Trans>
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-foreground/50">
            <th className="pb-2 font-medium">
              <Trans>Income</Trans>
            </th>
            {comparison.plans.map((p, i) => (
              <PlanHeaderCell key={i} label={p.label} index={i} />
            ))}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map(({ income, results }) => (
            <tr key={income} className="border-t border-border">
              <td className="py-2 align-top">{formatWholeDollars(income)}</td>
              {results.map((r, i) => {
                const change = r.totalTax - results[0].totalTax;
                return (
                  <td key={i} className="py-2 text-right align-top">
                    <div>
                      {formatWholeDollars(r.totalTax)}
                      <span className="text-foreground/40 text-xs ml-1">
                        {r.effectiveTaxRate.toFixed(1)}%
                      </span>
                    </div>
                    {i > 0 && (
                      <div
                        className={cn(
                          "text-xs font-medium",
                          deltaClass(change),
                        )}
                      >
                        {signedDollars(change)}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function payroll(calc: DetailedTaxCalculation) {
  return (
    calc.cppContribution +
    calc.cpp2Contribution +
    calc.eiContribution +
    calc.parentalInsuranceContribution
  );
}

/** Each plan's taxes broken down by component at the selected income. */
export function LineByLineTable({
  comparison,
  income,
}: {
  comparison: ScenarioComparison;
  income: number;
}) {
  const { t } = useLingui();
  const results = comparison.plans.map((p) => p.result);
  const rows = [
    {
      id: "federal",
      label: t`Federal income tax`,
      values: results.map((r) => r.federalIncomeTax - r.federalAbatement),
    },
    {
      id: "provincial",
      label: t`Provincial income tax`,
      values: results.map((r) => r.provincialIncomeTax),
    },
    {
      id: "surtax",
      label: t`Provincial surtax`,
      values: results.map((r) => r.surtax),
    },
    {
      id: "health-premium",
      label: t`Health premium`,
      values: results.map((r) => r.healthPremium),
    },
    {
      id: "payroll",
      label: t`CPP/QPP, EI and parental insurance`,
      values: results.map(payroll),
    },
  ].filter((row) => row.values.some((v) => v !== 0));

  return (
    <div className="bg-card rounded-lg border p-5 overflow-x-auto">
      <h3 className="font-bold text-lg mb-1">
        <Trans>Line by line</Trans>
      </h3>
      <p className="text-sm text-foreground/60 mb-4">
        <Trans>At {formatWholeDollars(income)} income</Trans>
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-foreground/50">
            <th className="pb-2 font-medium" />
            {comparison.plans.map((p, i) => (
              <PlanHeaderCell key={i} label={p.label} index={i} />
            ))}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border">
              <td className="py-2 pr-2">{row.label}</td>
              {row.values.map((v, i) => (
                <td key={i} className="py-2 text-right">
                  {formatWholeDollars(v)}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t-2 border-border font-semibold">
            <td className="py-2">
              <Trans>Total</Trans>
            </td>
            {comparison.plans.map((p, i) => (
              <td key={i} className="py-2 text-right">
                {formatWholeDollars(p.result.totalTax)}
                {i > 0 && (
                  <div
                    className={cn(
                      "text-xs font-medium",
                      deltaClass(p.difference),
                    )}
                  >
                    {signedDollars(p.difference)}
                  </div>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function ResultsFootnote() {
  return (
    <p className="mt-8 text-sm text-foreground/60 max-w-3xl">
      <Trans>
        Estimates assume employment income only and include federal and
        provincial income tax, the basic personal amount credit, surtaxes,
        health premiums, CPP/QPP, EI and QPIP. Other credits and deductions
        (such as RRSP contributions) aren&apos;t included. Changing brackets
        affects income tax only; payroll contributions stay at current rates.
        This shows the direct effect on individuals, not effects on government
        revenue or behaviour.
      </Trans>
    </p>
  );
}

/**
 * Share buttons for a view-only link. `path` is the view page path (with
 * locale) and `query` the scenario's query string.
 */
export function ShareActions({
  path,
  query,
  shareText,
  className,
}: {
  path: string;
  query: string;
  shareText: string;
  className?: string;
}) {
  const { t } = useLingui();
  const [origin, setOrigin] = useState("https://canadaspends.com");
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    setOrigin(window.location.origin);
    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  const shareUrl = `${origin}${path}?${query}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t`Link copied`);
    } catch {
      toast.error(t`Couldn't copy the link`);
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: shareText, url: shareUrl });
    } catch {
      // User cancelled
    }
  };

  const buttonClass =
    "inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent";

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Trans>Copy link</Trans>
      </button>
      {canNativeShare && (
        <button type="button" onClick={nativeShare} className={buttonClass}>
          <Trans>Share…</Trans>
        </button>
      )}
      <a
        className={buttonClass}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://x.com/intent/post?text=${encodedText}&url=${encodedUrl}`}
      >
        X
      </a>
      <a
        className={buttonClass}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://bsky.app/intent/compose?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
      >
        Bluesky
      </a>
      <a
        className={buttonClass}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
      >
        LinkedIn
      </a>
      <a
        className={buttonClass}
        href={`/api/og/tax-simulator?${query}`}
        download="tax-plan.png"
      >
        <Trans>Download image</Trans>
      </a>
    </div>
  );
}
