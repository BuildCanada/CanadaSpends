"use client";

import { useMemo } from "react";
import { Trans, useLingui } from "@lingui/react/macro";

import { PageContent, Section } from "@/components/Layout";
import {
  compareScenario,
  defaultScenarioTitle,
  formatWholeDollars,
  planHasChanges,
  PROVINCE_NAMES,
  serializeScenario,
  type TaxScenario,
} from "@/lib/tax";
import { localizedPath } from "@/lib/utils";

import {
  IncomeTable,
  LineByLineTable,
  TaxChartSection,
  ResultsFootnote,
  ResultsSummary,
  ShareActions,
} from "./ComparisonResults";
import { planColor } from "./planColors";

/** A plan's changes from current law, in words, for the read-only page. */
function usePlanChanges() {
  const { t } = useLingui();
  return (plan: TaxScenario["plans"][number]) => {
    const changes: string[] = [];
    const pct = (rate: number) => `${Math.round(rate * 100 * 1000) / 1000}%`;
    const describeBrackets = (b: { min: number; rate: number }[]) =>
      b
        .map((x, i) =>
          i === 0
            ? pct(x.rate)
            : t`${pct(x.rate)} over ${formatWholeDollars(x.min)}`,
        )
        .join(", ");
    const provinceName = PROVINCE_NAMES[plan.province] ?? plan.province;
    if (plan.federalBrackets) {
      changes.push(
        t`Federal brackets: ${describeBrackets(plan.federalBrackets)}`,
      );
    }
    if (plan.federalBpa !== null) {
      changes.push(
        t`Federal basic personal amount: ${formatWholeDollars(plan.federalBpa)}`,
      );
    }
    if (plan.provincialBrackets) {
      changes.push(
        t`${provinceName} brackets: ${describeBrackets(plan.provincialBrackets)}`,
      );
    }
    if (plan.provincialBpa !== null) {
      changes.push(
        t`${provinceName} basic personal amount: ${formatWholeDollars(plan.provincialBpa)}`,
      );
    }
    if (plan.removeSurtax) changes.push(t`No provincial surtax`);
    if (plan.removeHealthPremium) changes.push(t`No health premium`);
    return changes;
  };
}

/**
 * Read-only page for a shared comparison. Everything comes from the URL;
 * "Edit a copy" opens the same comparison in the simulator.
 */
export function TaxPlanView({ scenario }: { scenario: TaxScenario }) {
  const { t, i18n } = useLingui();
  const comparison = useMemo(() => compareScenario(scenario), [scenario]);
  const describeChanges = usePlanChanges();
  if (!comparison) return null;

  const query = serializeScenario(scenario).toString();
  const title = scenario.title || defaultScenarioTitle(scenario);
  const editorPath = localizedPath("/tax-visualizer/simulator", i18n.locale);
  const viewPath = localizedPath("/tax-visualizer/simulator/view", i18n.locale);

  return (
    <PageContent>
      <Section className="max-w-6xl">
        <div className="text-xs font-mono uppercase tracking-widest text-primary">
          <Trans>Tax Simulator</Trans>
        </div>
        <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight font-display max-w-4xl">
          {title}
        </h1>
        <p className="mt-4 text-lg text-foreground/60">
          <Trans>
            Comparing {comparison.plans.length} sets of tax rules at{" "}
            {formatWholeDollars(scenario.income)} of employment income
          </Trans>
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`${editorPath}?${query}`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Trans>Edit a copy</Trans>
          </a>
          <a
            href={editorPath}
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <Trans>Build your own</Trans>
          </a>
        </div>

        <div className="mt-10 bg-card rounded-lg border p-5 sm:p-6 space-y-8">
          <ResultsSummary
            comparison={comparison}
            income={scenario.income}
            changedFlags={comparison.plans.map((p) => planHasChanges(p.plan))}
          />
          <TaxChartSection comparison={comparison} income={scenario.income} />
        </div>

        <div className="mt-6 bg-card rounded-lg border p-5 sm:p-6">
          <h2 className="font-bold text-lg mb-4">
            <Trans>What each plan changes</Trans>
          </h2>
          <ul className="space-y-4">
            {comparison.plans.map((p, i) => {
              const changes = describeChanges(p.plan);
              const provinceName =
                PROVINCE_NAMES[p.plan.province] ?? p.plan.province;
              return (
                <li key={i} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-1.5 inline-block size-2.5 shrink-0 rounded-full"
                    style={{ background: planColor(i) }}
                  />
                  <div>
                    <div className="font-medium">{p.label}</div>
                    {changes.length === 0 ? (
                      <div className="text-sm text-foreground/60">
                        <Trans>
                          {provinceName} {p.plan.year} law, unchanged
                        </Trans>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm text-foreground/60">
                          <Trans>
                            {provinceName} {p.plan.year} law with these changes:
                          </Trans>
                        </div>
                        <ul className="mt-1 list-disc pl-5 text-sm text-foreground/80 space-y-0.5">
                          {changes.map((c) => (
                            <li key={c}>{c}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Section>

      <Section className="max-w-6xl mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IncomeTable comparison={comparison} />
          <LineByLineTable comparison={comparison} income={scenario.income} />
        </div>

        <div className="mt-6 bg-card rounded-lg border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-bold text-lg">
              <Trans>Share this comparison</Trans>
            </div>
            <p className="text-sm text-foreground/60">
              <Trans>Or edit a copy to make your own version.</Trans>
            </p>
          </div>
          <ShareActions
            path={viewPath}
            query={query}
            shareText={t`${title}: see how it would change your taxes`}
          />
        </div>

        <ResultsFootnote />
      </Section>
    </PageContent>
  );
}
