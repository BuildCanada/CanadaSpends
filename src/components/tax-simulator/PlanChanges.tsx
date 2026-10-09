"use client";

import { Trans, useLingui } from "@lingui/react/macro";

import { formatWholeDollars } from "@/lib/format";
import {
  effectivePlan,
  formatRate,
  getTaxConfig,
  provinceName as localProvinceName,
  toScenarioLang,
  type PlanResult,
  type ScenarioLang,
  type TaxBracket,
} from "@/lib/tax";
import { cn } from "@/lib/utils";

import { planColor } from "./planColors";

interface RateRow {
  from: number;
  to: number | null;
  current: number;
  proposed: number;
}

function rateAt(brackets: TaxBracket[], income: number): number {
  const bracket =
    [...brackets].reverse().find((b) => income >= b.min) ?? brackets[0];
  return bracket?.rate ?? 0;
}

/**
 * Income ranges covering both the current and proposed thresholds, with
 * each set of brackets' rate in every range, so moved or added brackets
 * line up.
 */
function rateRows(current: TaxBracket[], proposed: TaxBracket[]): RateRow[] {
  const starts = [...new Set([...current, ...proposed].map((b) => b.min))].sort(
    (a, b) => a - b,
  );
  return starts.map((from, i) => ({
    from,
    to: starts[i + 1] ?? null,
    current: rateAt(current, from),
    proposed: rateAt(proposed, from),
  }));
}

function changeClass(current: number, proposed: number) {
  if (proposed > current) return "text-auburn-700";
  if (proposed < current) return "text-pine-700";
  return "";
}

function RangeLabel({ from, to }: { from: number; to: number | null }) {
  if (to === null) {
    return <Trans>Over {formatWholeDollars(from)}</Trans>;
  }
  return (
    <>
      {formatWholeDollars(from)} – {formatWholeDollars(to)}
    </>
  );
}

interface ExtraRow {
  label: string;
  current: string;
  proposed: string;
  direction: number; // > 0 more tax, < 0 less tax
}

/** Current vs proposed for one level of government. */
function LevelChanges({
  title,
  rows,
  extras,
  lang,
}: {
  title: string;
  rows: RateRow[] | null;
  extras: ExtraRow[];
  lang: ScenarioLang;
}) {
  return (
    <div className="min-w-0">
      <h4 className="font-semibold mb-2">{title}</h4>
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="text-left text-foreground/50">
            <th className="pb-1.5 font-medium">
              <Trans>Taxable income</Trans>
            </th>
            <th className="pb-1.5 pl-3 font-medium text-right">
              <Trans>Current</Trans>
            </th>
            <th className="pb-1.5 pl-3 font-medium text-right">
              <Trans>Proposed</Trans>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows?.map((row) => {
            const changed = row.current !== row.proposed;
            return (
              <tr
                key={row.from}
                className={cn(
                  "border-t border-border",
                  changed
                    ? "bg-auburn-50/60 font-medium"
                    : "text-foreground/60",
                )}
              >
                <td className="py-1.5 pr-2">
                  <RangeLabel from={row.from} to={row.to} />
                </td>
                <td className="py-1.5 pl-3 text-right">
                  {formatRate(row.current * 100, lang, true)}
                </td>
                <td
                  className={cn(
                    "py-1.5 pl-3 text-right",
                    changeClass(row.current, row.proposed),
                  )}
                >
                  {formatRate(row.proposed * 100, lang, true)}
                </td>
              </tr>
            );
          })}
          {extras.map((extra) => (
            <tr
              key={extra.label}
              className="border-t border-border bg-auburn-50/60 font-medium"
            >
              <td className="py-1.5 pr-2">{extra.label}</td>
              <td className="py-1.5 pl-3 text-right">{extra.current}</td>
              <td
                className={cn(
                  "py-1.5 pl-3 text-right",
                  extra.direction > 0
                    ? "text-auburn-700"
                    : extra.direction < 0
                      ? "text-pine-700"
                      : "",
                )}
              >
                {extra.proposed}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * "What each plan changes": for each plan, its changes from current law as
 * current-vs-proposed tables.
 */
export function PlanChanges({ plans }: { plans: PlanResult[] }) {
  const { t, i18n } = useLingui();
  const lang = toScenarioLang(i18n.locale);

  return (
    <div className="space-y-6">
      {plans.map((p, i) => {
        const plan = effectivePlan(p.plan);
        const base = getTaxConfig(plan.year, plan.province);
        const provinceName = localProvinceName(plan.province, lang);
        const year = plan.year;
        if (!base) return null;

        const fed = base.federal.incomeTax;
        const prov = base.provincial.incomeTax;
        const bpaRow = (current: number, proposed: number | null) =>
          proposed === null
            ? []
            : [
                {
                  label: t`Basic personal amount`,
                  current: formatWholeDollars(current),
                  proposed: formatWholeDollars(proposed),
                  // A higher BPA means less tax
                  direction: current - proposed,
                },
              ];
        const eliminated = (label: string) => ({
          label,
          current: t`Applies`,
          proposed: t`Eliminated`,
          direction: -1,
        });

        const federalExtras = bpaRow(fed.basicPersonalAmount, plan.federalBpa);
        const provincialExtras = [
          ...bpaRow(prov.basicPersonalAmount, plan.provincialBpa),
          ...(plan.removeSurtax ? [eliminated(t`Provincial surtax`)] : []),
          ...(plan.removeHealthPremium ? [eliminated(t`Health premium`)] : []),
        ];
        const federalRows = plan.federalBrackets
          ? rateRows(fed.brackets, plan.federalBrackets)
          : null;
        const provincialRows = plan.provincialBrackets
          ? rateRows(prov.brackets, plan.provincialBrackets)
          : null;
        const showFederal = !!federalRows || federalExtras.length > 0;
        const showProvincial = !!provincialRows || provincialExtras.length > 0;
        const changed = showFederal || showProvincial;

        return (
          <div key={i} className="flex gap-3">
            <span
              aria-hidden
              className="mt-1.5 inline-block size-2.5 shrink-0 rounded-full"
              style={{ background: planColor(i) }}
            />
            <div className="min-w-0 flex-1">
              <div className="font-medium">{p.label}</div>
              {!changed ? (
                <div className="text-sm text-foreground/60">
                  <Trans>
                    {provinceName} {year} law, unchanged
                  </Trans>
                </div>
              ) : (
                <>
                  <div className="text-sm text-foreground/60">
                    <Trans>
                      Changes to {provinceName} {year} law
                    </Trans>
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                    {showFederal && (
                      <LevelChanges
                        title={t`Federal income tax`}
                        rows={federalRows}
                        extras={federalExtras}
                        lang={lang}
                      />
                    )}
                    {showProvincial && (
                      <LevelChanges
                        title={t`${provinceName} income tax`}
                        rows={provincialRows}
                        extras={provincialExtras}
                        lang={lang}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
