"use client";

import { useEffect, useMemo, useState } from "react";
import { Trans, useLingui } from "@lingui/react/macro";

import { PageContent, Section } from "@/components/Layout";
import {
  compareScenario,
  formatWholeDollars,
  MAX_SCENARIO_INCOME,
  planHasChanges,
  toScenarioLang,
  scenarioTitle,
  serializeScenario,
  type TaxScenario,
} from "@/lib/tax";
import { localizedPath } from "@/lib/utils";

import {
  TaxChartSection,
  ResultsFootnote,
  ResultsSummary,
  ShareActions,
} from "./ComparisonResults";
import { NumberField } from "./NumberField";
import { PlanChanges } from "./PlanChanges";

/**
 * Read-only page for a shared comparison. Everything comes from the URL;
 * "Edit a copy" opens the same comparison in the simulator.
 */
export function TaxPlanView({
  scenario: sharedScenario,
}: {
  scenario: TaxScenario;
}) {
  const { t, i18n } = useLingui();
  // Viewers can see the comparison at their own income. The shared plans
  // stay the same; only the income changes.
  const [income, setIncome] = useState(sharedScenario.income);
  const scenario = useMemo(
    () => ({ ...sharedScenario, income }),
    [sharedScenario, income],
  );
  const lang = toScenarioLang(i18n.locale);
  const comparison = useMemo(
    () => compareScenario(scenario, lang),
    [scenario, lang],
  );

  // Keep the URL in step so a refresh, "Edit a copy" or re-share keeps it
  useEffect(() => {
    const query = serializeScenario(scenario).toString();
    const url = `${window.location.pathname}?${query}`;
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", url);
    }
  }, [scenario]);
  if (!comparison) return null;

  const query = serializeScenario(scenario).toString();
  const title = scenarioTitle(scenario, lang);
  const editorPath = localizedPath("/tax-visualizer/simulator", i18n.locale);
  const viewPath = localizedPath("/tax-visualizer/simulator/view", i18n.locale);

  return (
    <PageContent>
      <Section className="max-w-6xl">
        {/* Shared scenarios are user-made: say so before the title */}
        <p className="mb-6 border-l-4 border-border bg-card px-4 py-3 text-sm text-foreground/70">
          <Trans>
            Tax changes entered by a Canada Spends Tax Simulator user. Canada
            Spends calculated the results but did not create or endorse them.
          </Trans>
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-display max-w-4xl">
          {title}
        </h1>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <a
              href={`${editorPath}?${query}`}
              className="inline-flex h-[42px] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Trans>Edit a copy</Trans>
            </a>
            <a
              href={editorPath}
              className="inline-flex h-[42px] items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-accent"
            >
              <Trans>Build your own</Trans>
            </a>
          </div>
          <div className="w-full sm:w-56">
            <label
              htmlFor="view-income"
              className="block text-sm font-medium mb-2"
            >
              <Trans>Income</Trans>
            </label>
            <NumberField
              id="view-income"
              ariaLabel={t`Your annual employment income`}
              prefix="$"
              value={income}
              commitOnChange
              min={1}
              max={MAX_SCENARIO_INCOME}
              onCommit={(value) => value > 0 && setIncome(Math.round(value))}
            />
          </div>
        </div>
        <p className="mt-2 text-sm text-foreground/60 sm:text-right">
          {income === sharedScenario.income ? (
            <Trans>
              Enter your income to see what each plan would mean for you.
            </Trans>
          ) : (
            <>
              <Trans>
                Showing your income. This comparison was shared at{" "}
                {formatWholeDollars(sharedScenario.income)}.
              </Trans>{" "}
              <button
                type="button"
                onClick={() => setIncome(sharedScenario.income)}
                className="text-primary hover:underline"
              >
                <Trans>Reset</Trans>
              </button>
            </>
          )}
        </p>

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
          <PlanChanges plans={comparison.plans} />
        </div>
      </Section>

      <Section className="max-w-6xl mt-6">
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
