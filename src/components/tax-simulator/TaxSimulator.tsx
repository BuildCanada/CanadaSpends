"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Trans, useLingui } from "@lingui/react/macro";

import { H1, PageContent, Section } from "@/components/Layout";
import {
  compareScenario,
  createDefaultScenario,
  createPlan,
  defaultScenarioTitle,
  formatWholeDollars,
  getSupportedYears,
  getTaxConfig,
  MAX_PLAN_NAME_LENGTH,
  MAX_SCENARIO_INCOME,
  MAX_PLANS,
  MAX_SCENARIO_BRACKETS,
  MAX_SCENARIO_TITLE_LENGTH,
  normalizeBrackets,
  parseScenario,
  percentToRate,
  planHasChanges,
  planLabel,
  planOverrideParams,
  PROVINCE_NAMES,
  PROVINCE_TO_CODE,
  rateToPercent,
  serializeScenario,
  type SupportedYear,
  type TaxBracket,
  type TaxPlan,
  type TaxScenario,
  type TaxYearProvinceConfig,
} from "@/lib/tax";
import { cn, localizedPath } from "@/lib/utils";

import {
  IncomeTable,
  LineByLineTable,
  TaxChartSection,
  ResultsFootnote,
  ResultsSummary,
  ShareActions,
} from "./ComparisonResults";
import { inputClass, NumberField } from "./NumberField";
import { planColor } from "./planColors";
import { socialImagePath } from "./socialImage";

const PROVINCES_SORTED = Object.entries(PROVINCE_NAMES).sort((a, b) =>
  a[1].localeCompare(b[1]),
);

function ModifiedBadge() {
  return (
    <span className="rounded-full bg-auburn-100 text-auburn-800 px-2 py-0.5 text-xs font-medium">
      <Trans>Modified</Trans>
    </span>
  );
}

interface BracketEditorProps {
  title: string;
  brackets: TaxBracket[];
  baselineBrackets: TaxBracket[];
  bpa: number;
  baselineBpa: number;
  modified: boolean;
  onBracketsChange: (brackets: TaxBracket[]) => void;
  onBpaChange: (bpa: number) => void;
  onReset: () => void;
  children?: React.ReactNode;
}

function BracketEditor({
  title,
  brackets,
  baselineBrackets,
  bpa,
  baselineBpa,
  modified,
  onBracketsChange,
  onBpaChange,
  onReset,
  children,
}: BracketEditorProps) {
  const { t } = useLingui();

  const update = (index: number, patch: Partial<TaxBracket>) => {
    onBracketsChange(
      normalizeBrackets(
        brackets.map((b, i) => (i === index ? { ...b, ...patch } : b)),
      ),
    );
  };

  const remove = (index: number) => {
    onBracketsChange(normalizeBrackets(brackets.filter((_, i) => i !== index)));
  };

  const add = () => {
    const last = brackets[brackets.length - 1];
    const prev = brackets[brackets.length - 2];
    const step = prev ? Math.max(10000, last.min - prev.min) : 50000;
    onBracketsChange(
      normalizeBrackets([
        ...brackets,
        { min: last.min + step, rate: Math.min(1, last.rate + 0.02) },
      ]),
    );
  };

  return (
    <div className="rounded-lg border border-border bg-background/50 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h4 className="font-bold">{title}</h4>
          {modified && <ModifiedBadge />}
        </div>
        {modified && (
          <button
            type="button"
            onClick={onReset}
            className="text-sm text-primary hover:underline"
          >
            <Trans>Reset</Trans>
          </button>
        )}
      </div>

      <div className="grid grid-cols-[1fr_7rem_2rem] gap-2 text-xs font-medium text-foreground/50 mb-1">
        <span>
          <Trans>Income above</Trans>
        </span>
        <span className="text-right pr-1">
          <Trans>Rate</Trans>
        </span>
        <span />
      </div>
      <div className="space-y-2">
        {brackets.map((bracket, index) => {
          const baseline = baselineBrackets[index];
          const rateChanged =
            !baseline ||
            rateToPercent(baseline.rate) !== rateToPercent(bracket.rate);
          return (
            <div
              key={`${index}-${brackets.length}`}
              className="grid grid-cols-[1fr_7rem_2rem] gap-2 items-center"
            >
              <NumberField
                ariaLabel={t`Bracket ${index + 1} starting income`}
                prefix="$"
                value={bracket.min}
                disabled={index === 0}
                onCommit={(min) => update(index, { min })}
              />
              <NumberField
                ariaLabel={t`Bracket ${index + 1} rate`}
                suffix="%"
                value={rateToPercent(bracket.rate)}
                commitOnChange
                className={cn(
                  rateChanged &&
                    modified &&
                    "[&_input]:border-auburn-400 [&_input]:bg-auburn-50",
                )}
                max={100}
                onCommit={(percent) =>
                  update(index, { rate: percentToRate(percent) })
                }
              />
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={brackets.length <= 1}
                aria-label={t`Remove bracket ${index + 1}`}
                className="h-9 w-8 rounded-md text-foreground/40 hover:text-auburn-700 hover:bg-auburn-50 disabled:opacity-30 disabled:pointer-events-none"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      {brackets.length < MAX_SCENARIO_BRACKETS && (
        <button
          type="button"
          onClick={add}
          className="mt-3 text-sm text-primary hover:underline"
        >
          + <Trans>Add bracket</Trans>
        </button>
      )}

      <div className="mt-4 pt-4 border-t border-border grid grid-cols-[1fr_10rem] gap-2 items-center">
        <label className="text-sm">
          <Trans>Basic personal amount</Trans>
          {bpa !== baselineBpa && (
            <span className="block text-xs text-foreground/50">
              <Trans>Currently {formatWholeDollars(baselineBpa)}</Trans>
            </span>
          )}
        </label>
        <NumberField
          ariaLabel={t`${title} basic personal amount`}
          prefix="$"
          value={bpa}
          onCommit={(value) => onBpaChange(Math.round(value))}
        />
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 rounded border-border text-primary focus:ring-ring"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}

interface Preset {
  id: string;
  label: string;
  name: string;
  apply: (p: TaxPlan, config: TaxYearProvinceConfig) => TaxPlan;
  available?: (config: TaxYearProvinceConfig) => boolean;
}

function usePresets(): Preset[] {
  const { t } = useLingui();
  return [
    {
      id: "flat",
      label: t`Flat 20% federal tax`,
      name: t`Flat 20% federal tax`,
      apply: (p) => ({
        ...p,
        federalBrackets: normalizeBrackets([{ min: 0, rate: 0.2 }]),
      }),
    },
    {
      id: "bpa",
      label: t`Basic personal amounts of $25k`,
      name: t`$25k tax-free threshold`,
      apply: (p) => ({ ...p, federalBpa: 25000, provincialBpa: 25000 }),
    },
    {
      id: "middle",
      label: t`Cut the 2nd federal bracket by 3 pts`,
      name: t`Middle-class tax cut`,
      apply: (p, config) => ({
        ...p,
        federalBrackets: (
          p.federalBrackets ?? config.federal.incomeTax.brackets
        ).map((b, i) =>
          i === 1 ? { ...b, rate: Math.max(0, b.rate - 0.03) } : b,
        ),
      }),
    },
    {
      id: "top",
      label: t`40% federal rate over $500k`,
      name: t`40% top federal rate`,
      apply: (p, config) => ({
        ...p,
        federalBrackets: normalizeBrackets([
          ...(p.federalBrackets ?? config.federal.incomeTax.brackets),
          { min: 500000, rate: 0.4 },
        ]),
      }),
    },
    {
      id: "premiums",
      label: t`Scrap surtax & health premium`,
      name: t`No surtax or health premium`,
      apply: (p) => ({ ...p, removeSurtax: true, removeHealthPremium: true }),
      available: (config) =>
        !!config.provincial.surtax || !!config.provincial.healthPremium,
    },
  ];
}

function clearProvincialOverrides(plan: TaxPlan): TaxPlan {
  return {
    ...plan,
    provincialBrackets: null,
    provincialBpa: null,
    removeSurtax: false,
    removeHealthPremium: false,
  };
}

function clearAllOverrides(plan: TaxPlan): TaxPlan {
  return {
    ...clearProvincialOverrides(plan),
    federalBrackets: null,
    federalBpa: null,
  };
}

interface PlanCardProps {
  plan: TaxPlan;
  index: number;
  plans: TaxPlan[];
  expanded: boolean;
  onToggle: () => void;
  onChange: (plan: TaxPlan) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  canRemove: boolean;
  canDuplicate: boolean;
}

function PlanCard({
  plan,
  index,
  plans,
  expanded,
  onToggle,
  onChange,
  onRemove,
  onDuplicate,
  canRemove,
  canDuplicate,
}: PlanCardProps) {
  const { t } = useLingui();
  const presets = usePresets();
  const supportedYears = getSupportedYears();
  const config = getTaxConfig(plan.year, plan.province);
  if (!config) return null;

  const set = (patch: Partial<TaxPlan>) => onChange({ ...plan, ...patch });
  const label = planLabel(plan, index, plans);
  const provinceName = PROVINCE_NAMES[plan.province] ?? plan.province;
  const changed = planHasChanges(plan);
  const fedConfig = config.federal.incomeTax;
  const provConfig = config.provincial.incomeTax;
  // Same test as the URL uses, so "Modified" matches what gets shared
  const overrides = planOverrideParams(plan);
  const federalModified = "fb" in overrides || "fbpa" in overrides;
  const provincialModified = ["pb", "pbpa", "nosurtax", "nohp"].some(
    (key) => key in overrides,
  );
  const bodyId = `plan-${index}-body`;

  return (
    <div
      className="bg-card rounded-lg border overflow-hidden"
      style={{ borderLeft: `4px solid ${planColor(index)}` }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={bodyId}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-foreground/[0.03]"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-foreground/50">
              {String.fromCharCode(65 + index)}
            </span>
            <span className="font-bold truncate">{label}</span>
            {index === 0 && (
              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs text-foreground/70">
                <Trans>Reference</Trans>
              </span>
            )}
            {changed && <ModifiedBadge />}
          </div>
          <div className="text-xs text-foreground/50 mt-0.5">
            {changed ? (
              <Trans>
                {provinceName} {plan.year}, with changes
              </Trans>
            ) : (
              <Trans>
                {provinceName} {plan.year} law, unchanged
              </Trans>
            )}
          </div>
        </div>
        <span
          aria-hidden
          className={cn(
            "text-foreground/40 transition-transform",
            expanded && "rotate-180",
          )}
        >
          ▾
        </span>
      </button>

      {expanded && (
        <div id={bodyId} className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_0.8fr] gap-3">
            <div>
              <label
                htmlFor={`plan-${index}-name`}
                className="block text-xs font-medium text-foreground/60 mb-1"
              >
                <Trans>Plan name</Trans>
              </label>
              <input
                id={`plan-${index}-name`}
                type="text"
                maxLength={MAX_PLAN_NAME_LENGTH}
                value={plan.name}
                placeholder={label}
                onChange={(e) => set({ name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor={`plan-${index}-province`}
                className="block text-xs font-medium text-foreground/60 mb-1"
              >
                <Trans>Province/Territory</Trans>
              </label>
              <select
                id={`plan-${index}-province`}
                value={plan.province}
                // Provincial overrides don't carry across provinces
                onChange={(e) =>
                  onChange({
                    ...clearProvincialOverrides(plan),
                    province: e.target.value,
                  })
                }
                className={inputClass}
              >
                {PROVINCES_SORTED.map(([value, name]) => (
                  <option key={value} value={value}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor={`plan-${index}-year`}
                className="block text-xs font-medium text-foreground/60 mb-1"
              >
                <Trans>Tax year</Trans>
              </label>
              <select
                id={`plan-${index}-year`}
                value={plan.year}
                // Overrides are copies of one year's thresholds and amounts,
                // so they don't carry across years
                onChange={(e) =>
                  onChange({
                    ...clearAllOverrides(plan),
                    year: e.target.value as SupportedYear,
                  })
                }
                className={inputClass}
              >
                {supportedYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-foreground/60 mb-2">
              <Trans>Start from an idea</Trans>
            </div>
            <div className="flex flex-wrap gap-2">
              {presets
                .filter((p) => !p.available || p.available(config))
                .map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...preset.apply(plan, config),
                        name: plan.name || preset.name,
                      })
                    }
                    className="rounded-full border border-border bg-background px-3 py-1 text-sm hover:border-primary hover:text-primary transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
            </div>
          </div>

          <BracketEditor
            title={t`Federal income tax`}
            brackets={plan.federalBrackets ?? fedConfig.brackets}
            baselineBrackets={fedConfig.brackets}
            bpa={plan.federalBpa ?? fedConfig.basicPersonalAmount}
            baselineBpa={fedConfig.basicPersonalAmount}
            modified={federalModified}
            onBracketsChange={(federalBrackets) => set({ federalBrackets })}
            onBpaChange={(federalBpa) => set({ federalBpa })}
            onReset={() => set({ federalBrackets: null, federalBpa: null })}
          />

          <BracketEditor
            title={t`${provinceName} income tax`}
            brackets={plan.provincialBrackets ?? provConfig.brackets}
            baselineBrackets={provConfig.brackets}
            bpa={plan.provincialBpa ?? provConfig.basicPersonalAmount}
            baselineBpa={provConfig.basicPersonalAmount}
            modified={provincialModified}
            onBracketsChange={(provincialBrackets) =>
              set({ provincialBrackets })
            }
            onBpaChange={(provincialBpa) => set({ provincialBpa })}
            onReset={() => onChange(clearProvincialOverrides(plan))}
          >
            {(config.provincial.surtax || config.provincial.healthPremium) && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                {config.provincial.surtax && (
                  <Toggle
                    checked={plan.removeSurtax}
                    onChange={(removeSurtax) => set({ removeSurtax })}
                    label={t`Eliminate the ${config.provincial.surtax.name}`}
                  />
                )}
                {config.provincial.healthPremium && (
                  <Toggle
                    checked={plan.removeHealthPremium}
                    onChange={(removeHealthPremium) =>
                      set({ removeHealthPremium })
                    }
                    label={t`Eliminate the ${config.provincial.healthPremium.name}`}
                  />
                )}
              </div>
            )}
          </BracketEditor>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {changed && (
              <button
                type="button"
                onClick={() => onChange(clearAllOverrides(plan))}
                className="text-foreground/60 hover:text-foreground"
              >
                <Trans>Reset to current law</Trans>
              </button>
            )}
            {canDuplicate && (
              <button
                type="button"
                onClick={onDuplicate}
                className="text-foreground/60 hover:text-foreground"
              >
                <Trans>Duplicate</Trans>
              </button>
            )}
            {canRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="text-auburn-700 hover:underline"
              >
                <Trans>Remove from comparison</Trans>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddComparison({
  scenario,
  onAdd,
}: {
  scenario: TaxScenario;
  onAdd: (plan: TaxPlan) => void;
}) {
  const { t } = useLingui();
  const reference = scenario.plans[0];
  const used = new Set(
    scenario.plans.filter((p) => !planHasChanges(p)).map((p) => p.province),
  );

  return (
    <div className="rounded-lg border border-dashed border-border p-4">
      <div className="text-sm font-medium mb-3">
        <Trans>Add to the comparison</Trans>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="add-province"
            className="block text-xs text-foreground/60 mb-1"
          >
            <Trans>Another province&apos;s current law</Trans>
          </label>
          <select
            id="add-province"
            value=""
            onChange={(e) => {
              if (e.target.value) {
                onAdd(createPlan(e.target.value, reference.year));
              }
            }}
            className={inputClass}
          >
            <option value="">{t`Choose a province…`}</option>
            {PROVINCES_SORTED.filter(([value]) => !used.has(value)).map(
              ([value, name]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ),
            )}
          </select>
        </div>
        <div>
          <span className="block text-xs text-foreground/60 mb-1">
            <Trans>A new plan to edit</Trans>
          </span>
          <button
            type="button"
            onClick={() =>
              onAdd(createPlan(reference.province, reference.year))
            }
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:border-primary hover:text-primary"
          >
            + <Trans>Another plan</Trans>
          </button>
        </div>
      </div>
    </div>
  );
}

function SharePanel({ scenario }: { scenario: TaxScenario }) {
  const { t, i18n } = useLingui();
  const query = serializeScenario(scenario).toString();
  // Debounce the preview image so it doesn't re-render on every keystroke
  const [previewQuery, setPreviewQuery] = useState(query);
  useEffect(() => {
    const id = setTimeout(() => setPreviewQuery(query), 600);
    return () => clearTimeout(id);
  }, [query]);

  const viewPath = localizedPath("/tax-visualizer/simulator/view", i18n.locale);
  const title = scenario.title || defaultScenarioTitle(scenario);
  const shareText = t`${title}: see how it would change your taxes`;

  return (
    <div className="bg-card rounded-lg border p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-lg">
          <Trans>Share</Trans>
        </h3>
        <a
          href={`${viewPath}?${query}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline whitespace-nowrap"
        >
          <Trans>Open shareable page ↗</Trans>
        </a>
      </div>
      <p className="text-sm text-foreground/60 mt-1 mb-4">
        <Trans>
          The link opens a read-only page with this comparison. Everything is
          stored in the link itself.
        </Trans>
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={socialImagePath(previewQuery)}
        alt={t`Social preview of this comparison`}
        width={1200}
        height={630}
        className="w-full h-auto rounded-md border border-border bg-linen-100"
      />
      <ShareActions
        className="mt-4"
        path={viewPath}
        query={query}
        shareText={shareText}
      />
    </div>
  );
}

export function TaxSimulator() {
  const { t, i18n } = useLingui();
  const searchParams = useSearchParams();

  const [scenario, setScenario] = useState<TaxScenario>(() =>
    searchParams ? parseScenario(searchParams) : createDefaultScenario(),
  );
  // Open the first changed plan (or plan B) for editing
  const [expanded, setExpanded] = useState<number | null>(() => {
    const changedIndex = scenario.plans.findIndex(planHasChanges);
    if (changedIndex >= 0) return changedIndex;
    return scenario.plans.length > 1 ? 1 : 0;
  });

  // Keep every parameter in the URL so the editor can be bookmarked
  useEffect(() => {
    const query = serializeScenario(scenario).toString();
    const url = `${window.location.pathname}?${query}`;
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", url);
    }
  }, [scenario]);

  const comparison = useMemo(() => compareScenario(scenario), [scenario]);
  if (!comparison) return null;

  const setPlan = (index: number, plan: TaxPlan) =>
    setScenario((s) => ({
      ...s,
      plans: s.plans.map((p, i) => (i === index ? plan : p)),
    }));
  const removePlan = (index: number) => {
    setScenario((s) => ({
      ...s,
      plans: s.plans.filter((_, i) => i !== index),
    }));
    setExpanded(null);
  };
  const addPlan = (plan: TaxPlan) => {
    setScenario((s) => ({ ...s, plans: [...s.plans, plan] }));
    setExpanded(planHasChanges(plan) ? null : scenario.plans.length);
  };

  const reference = scenario.plans[0];
  const canAdd = scenario.plans.length < MAX_PLANS;

  return (
    <PageContent>
      <Section className="max-w-6xl">
        <a
          href={localizedPath(
            `/tax-visualizer?income=${scenario.income}&province=${PROVINCE_TO_CODE[reference.province]}&year=${reference.year}`,
            i18n.locale,
          )}
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          ← <Trans>Tax Visualizer</Trans>
        </a>
        <div className="mt-4 mb-8 max-w-3xl">
          <H1>{t`Tax Simulator`}</H1>
          <p className="text-lg text-foreground/60 mt-4">
            {t`Rewrite the tax brackets, compare your plan with current law, another province, or another plan, and share the result.`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 items-start">
          {/* Left: controls */}
          <div className="space-y-4">
            <div className="bg-card rounded-lg border p-5 grid grid-cols-1 sm:grid-cols-[1fr_11rem] gap-3">
              <div>
                <label
                  htmlFor="scenario-title"
                  className="block text-sm font-medium text-foreground/70 mb-2"
                >
                  <Trans>Title</Trans>
                </label>
                <input
                  id="scenario-title"
                  type="text"
                  maxLength={MAX_SCENARIO_TITLE_LENGTH}
                  value={scenario.title}
                  onChange={(e) =>
                    setScenario((s) => ({ ...s, title: e.target.value }))
                  }
                  placeholder={defaultScenarioTitle(scenario)}
                  className={cn(inputClass, "font-display")}
                />
              </div>
              <div>
                <label
                  htmlFor="scenario-income"
                  className="block text-sm font-medium text-foreground/70 mb-2"
                >
                  <Trans>Income</Trans>
                </label>
                <NumberField
                  id="scenario-income"
                  ariaLabel={t`Annual income`}
                  prefix="$"
                  value={scenario.income}
                  commitOnChange
                  min={1}
                  max={MAX_SCENARIO_INCOME}
                  onCommit={(income) =>
                    income > 0 &&
                    setScenario((s) => ({ ...s, income: Math.round(income) }))
                  }
                />
              </div>
            </div>

            {scenario.plans.map((plan, index) => (
              <PlanCard
                key={index}
                plan={plan}
                index={index}
                plans={scenario.plans}
                expanded={expanded === index}
                onToggle={() =>
                  setExpanded((e) => (e === index ? null : index))
                }
                onChange={(p) => setPlan(index, p)}
                onRemove={() => removePlan(index)}
                onDuplicate={() =>
                  addPlan({
                    ...plan,
                    name: plan.name ? t`${plan.name} (copy)` : "",
                  })
                }
                canRemove={scenario.plans.length > 1}
                canDuplicate={canAdd}
              />
            ))}

            {canAdd && <AddComparison scenario={scenario} onAdd={addPlan} />}
          </div>

          {/* Right: results */}
          <div className="space-y-6 lg:sticky lg:top-6">
            <div className="bg-card rounded-lg border p-5 space-y-6">
              <ResultsSummary
                comparison={comparison}
                income={scenario.income}
                changedFlags={comparison.plans.map((p) =>
                  planHasChanges(p.plan),
                )}
              />
              <TaxChartSection
                comparison={comparison}
                income={scenario.income}
              />
            </div>
            <SharePanel scenario={scenario} />
          </div>
        </div>
      </Section>

      <Section className="max-w-6xl mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IncomeTable comparison={comparison} />
          <LineByLineTable comparison={comparison} income={scenario.income} />
        </div>
        <ResultsFootnote />
      </Section>
    </PageContent>
  );
}
