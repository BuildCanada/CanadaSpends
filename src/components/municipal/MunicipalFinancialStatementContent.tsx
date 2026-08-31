"use client";

import { useState } from "react";
import { Trans } from "@lingui/react/macro";
import { FinancialYearSelector } from "@/components/FinancialYearSelector";
import {
  H1,
  H2,
  Intro,
  P,
  Page,
  PageContent,
  Section,
} from "@/components/Layout";
import { JurisdictionSankey } from "@/components/Sankey/JurisdictionSankey";
import { Tooltip } from "@/components/Tooltip";
import {
  SourceDocumentIcon,
  SourceDocumentViewer,
} from "@/components/first-nations/SourceDocumentViewer";
import type {
  MunicipalFinancialFact,
  MunicipalStatement,
  MunicipalityFinancialDetail,
} from "@/lib/municipal-financial-statements";
import { formatCompactCurrency } from "@/lib/format-compact-currency";

function conceptLabel(concept: MunicipalFinancialFact["concept"]) {
  switch (concept) {
    case "total_financial_assets":
      return <Trans>Total financial assets</Trans>;
    case "total_liabilities":
      return <Trans>Total liabilities</Trans>;
    case "net_financial_assets":
      return <Trans>Net financial assets (debt)</Trans>;
    case "total_non_financial_assets":
      return <Trans>Total non-financial assets</Trans>;
    case "accumulated_surplus":
      return <Trans>Accumulated surplus</Trans>;
    case "opening_accumulated_surplus":
      return <Trans>Opening accumulated surplus</Trans>;
    case "total_revenue":
      return <Trans>Total revenue</Trans>;
    case "total_expenses":
      return <Trans>Total expenses</Trans>;
    case "annual_surplus":
      return <Trans>Annual surplus (deficit)</Trans>;
  }
}

function formatCurrency(value: number, lang: string): string {
  return formatCompactCurrency(value, {
    locale: lang === "fr" ? "fr-CA" : "en-CA",
  });
}

function formatCurrencyExact(value: number, lang: string): string {
  return new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number, lang: string, maximumFractionDigits = 1) {
  return new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", {
    maximumFractionDigits,
  }).format(value);
}

const HelpIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="ml-2 cursor-help text-gray-500"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.1 9a3 3 0 1 1 4.9 2.3c-1 .7-2 1.2-2 2.7" />
    <path d="M12 17h.01" />
  </svg>
);

function SummaryCard({
  label,
  value,
  description,
  help,
}: {
  label: React.ReactNode;
  value: string;
  description: React.ReactNode;
  help: React.ReactNode;
}) {
  return (
    <div className="border-l-4 border-auburn-700 bg-gray-50 p-5">
      <div className="flex items-center text-sm text-gray-600">
        {label}
        <Tooltip text={help}>
          <HelpIcon />
        </Tooltip>
      </div>
      <div className="my-1 text-3xl font-bold">{value}</div>
      <div className="text-sm text-gray-600">{description}</div>
    </div>
  );
}

function factFor(
  statement: MunicipalStatement,
  concept: MunicipalFinancialFact["concept"],
): MunicipalFinancialFact | undefined {
  return statement.facts.find((fact) => fact.concept === concept);
}

function FactCard({
  fact,
  sourceUrl,
  lang,
}: {
  fact: MunicipalFinancialFact;
  sourceUrl: string | null;
  lang: string;
}) {
  const source = sourceUrl ? `${sourceUrl}#page=${fact.source_page}` : null;
  return (
    <div className="border-l-4 border-auburn-700 bg-gray-50 p-5">
      <div className="text-sm text-gray-600">{conceptLabel(fact.concept)}</div>
      <div className="my-1 text-3xl font-bold">
        {formatCurrency(fact.value, lang)}
      </div>
      <div className="text-xs text-gray-500">
        <Trans>Reported as “{fact.raw_label}”</Trans>
        {source && (
          <>
            {" · "}
            <a
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-auburn-700 underline"
            >
              <Trans>page {fact.source_page}</Trans>
            </a>
          </>
        )}
      </div>
    </div>
  );
}

function OperationsComparison({
  statement,
  lang,
}: {
  statement: MunicipalStatement;
  lang: string;
}) {
  const revenue = factFor(statement, "total_revenue");
  const expenses = factFor(statement, "total_expenses");
  if (!revenue || !expenses) return null;
  const maximum = Math.max(
    Math.abs(revenue.value),
    Math.abs(expenses.value),
    1,
  );

  return (
    <div className="mt-7 max-w-3xl space-y-4">
      {[
        {
          key: "revenue",
          label: <Trans>Revenue</Trans>,
          value: revenue.value,
          colour: "bg-emerald-700",
        },
        {
          key: "expenses",
          label: <Trans>Expenses</Trans>,
          value: expenses.value,
          colour: "bg-auburn-700",
        },
      ].map(({ key, label, value, colour }) => (
        <div key={key}>
          <div className="mb-1 flex justify-between gap-4 text-sm font-medium">
            <span>{label}</span>
            <span>{formatCurrency(value, lang)}</span>
          </div>
          <div className="h-5 bg-gray-100">
            <div
              className={`h-full ${colour}`}
              style={{
                width: `${(Math.abs(value) / maximum) * 100}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function VerificationResults({
  statement,
  lang,
}: {
  statement: MunicipalStatement;
  lang: string;
}) {
  const { verification } = statement;
  if (!verification) return null;

  const reviewedAt = new Intl.DateTimeFormat(
    lang === "fr" ? "fr-CA" : "en-CA",
    { dateStyle: "long", timeZone: "UTC" },
  ).format(new Date(verification.reviewed_at));

  return (
    <div className="mt-6 border border-gray-200 bg-gray-50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold">
            {verification.summary.fail === 0 ? (
              <Trans>Independent verification completed</Trans>
            ) : (
              <Trans>Verification requires attention</Trans>
            )}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            <Trans>
              Reviewed by {verification.reviewed_by} on {reviewedAt}
            </Trans>
          </div>
        </div>
        <div className="flex gap-2 text-xs font-semibold uppercase tracking-wide">
          <span className="bg-emerald-100 px-2 py-1 text-emerald-800">
            <Trans>{verification.summary.pass} passed</Trans>
          </span>
          {verification.summary.skip > 0 && (
            <span className="bg-gray-200 px-2 py-1 text-gray-700">
              <Trans>{verification.summary.skip} skipped</Trans>
            </span>
          )}
          {verification.summary.fail > 0 && (
            <span className="bg-red-100 px-2 py-1 text-red-800">
              <Trans>{verification.summary.fail} failed</Trans>
            </span>
          )}
        </div>
      </div>
      {verification.review_notes && (
        <p className="mt-3 text-sm text-gray-700">
          {verification.review_notes}
        </p>
      )}
      <details className="mt-4 border-t border-gray-200 pt-4">
        <summary className="cursor-pointer font-medium text-auburn-700">
          <Trans>
            View all {verification.summary.total} verification checks
          </Trans>
        </summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-gray-600">
                <th className="px-2 py-2 font-medium">
                  <Trans>Result</Trans>
                </th>
                <th className="px-2 py-2 font-medium">
                  <Trans>Test</Trans>
                </th>
                <th className="px-2 py-2 font-medium">
                  <Trans>Details</Trans>
                </th>
              </tr>
            </thead>
            <tbody>
              {verification.checks.map((check, index) => (
                <tr
                  key={`${check.id}-${index}`}
                  className="border-b border-gray-200 align-top last:border-0"
                >
                  <td className="whitespace-nowrap px-2 py-2 font-semibold uppercase">
                    {check.status === "pass" ? (
                      <Trans>Pass</Trans>
                    ) : check.status === "skip" ? (
                      <Trans>Skipped</Trans>
                    ) : (
                      <Trans>Fail</Trans>
                    )}
                  </td>
                  <td className="px-2 py-2 font-mono text-xs">{check.id}</td>
                  <td className="px-2 py-2 text-gray-700">{check.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export function MunicipalFinancialStatementContent({
  municipality,
  statement,
  lang,
}: {
  municipality: MunicipalityFinancialDetail;
  statement: MunicipalStatement;
  lang: string;
}) {
  const [showSource, setShowSource] = useState(false);
  const sourceUrl = statement.source.download_url || statement.source.page_url;
  const fiscalYearEnd = new Intl.DateTimeFormat(
    lang === "fr" ? "fr-CA" : "en-CA",
    { dateStyle: "long", timeZone: "UTC" },
  ).format(new Date(`${statement.fiscal_year_end}T00:00:00Z`));
  const operations = ["annual_surplus", "total_revenue", "total_expenses"]
    .map((concept) =>
      factFor(statement, concept as MunicipalFinancialFact["concept"]),
    )
    .filter((fact): fact is MunicipalFinancialFact => Boolean(fact));
  const position = [
    "total_financial_assets",
    "total_liabilities",
    "net_financial_assets",
    "total_non_financial_assets",
    "accumulated_surplus",
  ]
    .map((concept) =>
      factFor(statement, concept as MunicipalFinancialFact["concept"]),
    )
    .filter((fact): fact is MunicipalFinancialFact => Boolean(fact));
  const revenue = factFor(statement, "total_revenue");
  const expenses = factFor(statement, "total_expenses");
  const surplus = factFor(statement, "annual_surplus");
  const context = municipality.context;
  const censusYear = context.census_year;

  return (
    <Page>
      <PageContent>
        <Section>
          <H1>{municipality.name}</H1>
          <Intro>
            <Trans>
              Reviewed financial statement data for {municipality.name} in{" "}
              {municipality.province_name}, for the fiscal year ending{" "}
              {fiscalYearEnd}.
            </Trans>
          </Intro>
          {context.population && censusYear && (
            <P>
              <Trans>
                The municipality serves a {censusYear} Census population of{" "}
                {formatNumber(context.population, lang, 0)} across{" "}
                {formatNumber(context.area_sq_km || 0, lang)} square kilometres.
              </Trans>
            </P>
          )}
        </Section>

        {statement.sankey && (
          <>
            <Section>
              <H2>
                <span className="inline-flex items-center">
                  <Trans>Where the money came from and where it went</Trans>
                  <SourceDocumentIcon
                    sourceUrl={sourceUrl}
                    documentType="municipal financial statements"
                    isOpen={showSource}
                    onToggle={() => setShowSource(!showSource)}
                  />
                </span>
              </H2>
              <P>
                <Trans>
                  Revenue sources flow in from the left and spending by service
                  or function flows out on the right. Revenue offsets and losses
                  are shown as outflows, while expense recoveries are shown as
                  inflows. Values come from detailed schedules in the audited
                  financial statements.
                </Trans>
              </P>
              <SourceDocumentViewer
                sourceUrl={sourceUrl}
                documentType="Municipal financial statements"
                isOpen={showSource}
              />
            </Section>
            <div className="sankey-chart-container relative overflow-hidden sm:(mr-0 ml-0) md:(min-h-[776px] min-w-[1280px] w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2)">
              <JurisdictionSankey
                data={statement.sankey}
                amountScalingFactor={1}
              />
            </div>
          </>
        )}

        {statement.line_items.length > 0 && (
          <Section>
            <H2>
              <Trans>Reported revenue and expense details</Trans>
            </H2>
            <P>
              <Trans>
                These are the detailed rows extracted from the audited
                statement. This table preserves every signed amount, including
                negative and consolidation entries that the Sankey repositions
                as offsets or recoveries.
              </Trans>
            </P>
            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              {(["revenue", "expense"] as const).map((flow) => {
                const items = statement.line_items.filter(
                  (item) => item.flow === flow,
                );
                if (items.length === 0) return null;
                return (
                  <div key={flow}>
                    <h3 className="mb-3 text-lg font-semibold">
                      {flow === "revenue" ? (
                        <Trans>Revenue</Trans>
                      ) : (
                        <Trans>Expenses</Trans>
                      )}
                    </h3>
                    <div className="overflow-x-auto border border-gray-200">
                      <table className="w-full text-sm">
                        <tbody>
                          {items.map((item, index) => (
                            <tr
                              key={`${flow}-${item.position ?? index}-${item.label}`}
                              className="border-b border-gray-100 last:border-b-0"
                            >
                              <td className="px-3 py-2">
                                <span className="block font-medium">
                                  {item.label}
                                </span>
                                {sourceUrl && (
                                  <a
                                    href={`${sourceUrl}#page=${item.source_page}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-auburn-700 underline"
                                  >
                                    <Trans>page {item.source_page}</Trans>
                                  </a>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums">
                                {formatCurrencyExact(item.value, lang)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {operations.length > 0 && (
          <Section>
            <H2>
              <Trans>Financial summary for {statement.fiscal_year}</Trans>
            </H2>
            <P>
              <Trans>
                How much the municipality reported earning and spending during
                the fiscal year.
              </Trans>
            </P>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {surplus && (
                <SummaryCard
                  label={<Trans>Annual surplus (deficit)</Trans>}
                  value={formatCurrency(surplus.value, lang)}
                  description={<Trans>Revenue remaining after expenses</Trans>}
                  help={
                    <Trans>
                      The reported difference between annual revenue and
                      expenses, including any separately presented adjustments.
                    </Trans>
                  }
                />
              )}
              {revenue && (
                <SummaryCard
                  label={<Trans>Total revenue</Trans>}
                  value={formatCurrency(revenue.value, lang)}
                  description={
                    statement.per_capita?.total_revenue ? (
                      <Trans>
                        {formatCurrency(
                          statement.per_capita.total_revenue,
                          lang,
                        )}{" "}
                        per resident
                      </Trans>
                    ) : (
                      <Trans>All reported municipal revenue</Trans>
                    )
                  }
                  help={
                    <Trans>
                      Taxes, transfers, fees, services, and other reported
                      income.
                    </Trans>
                  }
                />
              )}
              {expenses && (
                <SummaryCard
                  label={<Trans>Total expenses</Trans>}
                  value={formatCurrency(expenses.value, lang)}
                  description={
                    statement.per_capita?.total_expenses ? (
                      <Trans>
                        {formatCurrency(
                          statement.per_capita.total_expenses,
                          lang,
                        )}{" "}
                        per resident
                      </Trans>
                    ) : (
                      <Trans>All reported municipal expenses</Trans>
                    )
                  }
                  help={
                    <Trans>
                      Program, service, administration, financing, and
                      amortization expenses.
                    </Trans>
                  }
                />
              )}
            </div>
            <OperationsComparison statement={statement} lang={lang} />
          </Section>
        )}

        {context.population && censusYear && (
          <Section>
            <H2>
              <Trans>Community context</Trans>
            </H2>
            <P>
              <Trans>
                Census context makes municipal totals easier to compare, while
                recognizing that municipal boundaries and service
                responsibilities differ.
              </Trans>
            </P>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FactCardSimple
                label={<Trans>Population</Trans>}
                value={formatNumber(context.population, lang, 0)}
                note={<Trans>{censusYear} Census</Trans>}
              />
              {context.area_sq_km && (
                <FactCardSimple
                  label={<Trans>Land area</Trans>}
                  value={`${formatNumber(context.area_sq_km, lang)} km²`}
                  note={<Trans>Municipal census subdivision</Trans>}
                />
              )}
              {context.population_density_per_sq_km && (
                <FactCardSimple
                  label={<Trans>Population density</Trans>}
                  value={formatNumber(
                    context.population_density_per_sq_km,
                    lang,
                  )}
                  note={<Trans>Residents per km²</Trans>}
                />
              )}
              {statement.per_capita?.total_expenses && (
                <FactCardSimple
                  label={<Trans>Expenses per resident</Trans>}
                  value={formatCurrency(
                    statement.per_capita.total_expenses,
                    lang,
                  )}
                  note={<Trans>Financial year {statement.fiscal_year}</Trans>}
                />
              )}
            </div>
          </Section>
        )}

        {position.length > 0 && (
          <Section>
            <H2>
              <Trans>Financial position</Trans>
            </H2>
            <P>
              <Trans>
                Assets, liabilities, and accumulated surplus at the end of the
                fiscal year.
              </Trans>
            </P>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {position.map((fact) => (
                <FactCard
                  key={fact.concept}
                  fact={fact}
                  sourceUrl={sourceUrl}
                  lang={lang}
                />
              ))}
            </div>
          </Section>
        )}

        <Section>
          <FinancialYearSelector
            basePath={`/${lang}/municipal/${municipality.province_slug}/${municipality.slug}`}
            currentYear={String(statement.fiscal_year)}
            availableYears={municipality.available_years.map(String)}
            formatYear={(year) => {
              const period = municipality.available_periods.find(
                (candidate) => String(candidate.year) === year,
              );
              return formatFiscalYearLabel(period?.fiscal_year_end ?? year);
            }}
          />
        </Section>

        <Section>
          <H2>
            <Trans>Source and methodology</Trans>
          </H2>
          <P>
            <Trans>
              Values are extracted from the municipality’s published financial
              statements and independently reviewed before publication. Page
              links point to the reported figure in the source document.
            </Trans>
          </P>
          <VerificationResults statement={statement} lang={lang} />
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block font-medium text-auburn-700 underline"
            >
              <Trans>View source financial statements</Trans>
            </a>
          )}
        </Section>
      </PageContent>
    </Page>
  );
}

function FactCardSimple({
  label,
  value,
  note,
}: {
  label: React.ReactNode;
  value: string;
  note: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 p-5">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="my-1 text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{note}</div>
    </div>
  );
}

function formatFiscalYearLabel(fiscalYearEnd: string): string {
  if (!fiscalYearEnd.includes("-")) return `FY ${fiscalYearEnd}`;

  const date = new Date(`${fiscalYearEnd}T00:00:00Z`);
  const endYear = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return month <= 2
    ? `FY ${endYear - 1}-${String(endYear).slice(-2)}`
    : `FY ${endYear}`;
}
