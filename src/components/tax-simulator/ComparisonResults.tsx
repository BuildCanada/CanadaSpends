"use client";

import { useEffect, useMemo, useState } from "react";
import { Trans, useLingui } from "@lingui/react/macro";
import { toast } from "sonner";

import {
  buildRateCurve,
  chartMaxIncome,
  formatWholeDollars,
  provinceName as localProvinceName,
  formatDecimal,
  inProvince,
  SCENARIO_TEXT,
  toScenarioLang,
  type ScenarioComparison,
} from "@/lib/tax";
import { cn } from "@/lib/utils";

import { planColor } from "./planColors";
import { socialImagePath, warmSocialImage } from "./socialImage";
import { TaxPaidChart } from "./TaxPaidChart";

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
  const { i18n } = useLingui();
  const provinceName = localProvinceName(province, toScenarioLang(i18n.locale));
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
  const { i18n } = useLingui();
  const lang = toScenarioLang(i18n.locale);
  // Same lead-in as the social preview: "A person earning $X in <province>
  // would pay…", followed by each plan's total
  const provinces = new Set(plans.map((p) => p.plan.province));
  const where =
    provinces.size === 1 ? inProvince(plans[0].plan.province, lang) : "";
  return (
    <div className="@container">
      <p className="text-lg text-foreground/70 mb-3">
        {SCENARIO_TEXT[lang].wouldPay(formatWholeDollars(income), where)}
      </p>
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
              <Trans>
                {formatDecimal(p.result.effectiveTaxRate, lang)}% effective
              </Trans>
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
      {/* The difference from the reference first: plans that differ by a
          few thousand dollars are hard to tell apart on the total chart */}
      {comparison.plans.length > 1 && (
        <div className="mb-6">
          <TaxPaidChart
            mode="difference"
            points={curve}
            labels={comparison.plans.map((p) => p.label)}
            maxIncome={maxIncome}
            income={income}
          />
        </div>
      )}
      <TaxPaidChart
        points={curve}
        labels={comparison.plans.map((p) => p.label)}
        maxIncome={maxIncome}
        income={income}
      />
      <p className="text-xs text-foreground/50 mt-2">
        <Trans>
          The dotted line marks the selected income of{" "}
          {formatWholeDollars(income)}.
        </Trans>
      </p>
    </div>
  );
}

export function ResultsFootnote() {
  return (
    <p className="mt-8 text-sm text-foreground/60 max-w-3xl">
      <Trans>
        Estimates assume employment income only. They include federal and
        provincial income tax with the non-refundable credits that depend only
        on income (the basic personal amount, CPP/QPP and EI contributions, and
        the Canada employment amount), low-income tax reductions, surtaxes,
        health premiums, CPP/QPP, EI and QPIP. Credits that depend on personal
        circumstances (such as age, dependants or tuition) and deductions such
        as RRSP contributions aren&apos;t included. Changing brackets affects
        income tax only; payroll contributions stay at current rates. This shows
        the direct effect on individuals, not effects on government revenue or
        behaviour.
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
  const { t, i18n } = useLingui();
  const [origin, setOrigin] = useState("https://canadaspends.com");
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    setOrigin(window.location.origin);
    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  // Warm the social image cache once the scenario settles, so the image is
  // ready by the time someone shares the link.
  useEffect(() => {
    const id = setTimeout(() => warmSocialImage(query, i18n.locale), 1000);
    return () => clearTimeout(id);
  }, [query, i18n.locale]);
  const warm = () => warmSocialImage(query, i18n.locale);

  const shareUrl = `${origin}${path}?${query}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  const copy = async () => {
    warm();
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t`Link copied`);
    } catch {
      toast.error(t`Couldn't copy the link`);
    }
  };

  const nativeShare = async () => {
    warm();
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
        onClick={warm}
        className={buttonClass}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://x.com/intent/post?text=${encodedText}&url=${encodedUrl}`}
      >
        X
      </a>
      <a
        onClick={warm}
        className={buttonClass}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://bsky.app/intent/compose?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
      >
        Bluesky
      </a>
      <a
        onClick={warm}
        className={buttonClass}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
      >
        LinkedIn
      </a>
      <a
        className={buttonClass}
        href={socialImagePath(query, i18n.locale)}
        download="tax-plan.png"
      >
        <Trans>Download image</Trans>
      </a>
    </div>
  );
}
