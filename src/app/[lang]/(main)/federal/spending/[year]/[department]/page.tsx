import UpdatedAt from "@/app/[lang]/(main)/federal/spending/_common/updatedAt";
import { BillionsBarList } from "@/components/BillionsBarList";
import { HistoricalShareChart } from "@/components/HistoricalShareChart";
import {
  InflationProvider,
  InflationValue,
} from "@/components/InflationContext";
import { InflationToggle } from "@/components/InflationToggle";
import {
  ChartContainer,
  H1,
  H2,
  H3,
  InternalLink,
  Intro,
  P,
  Page,
  PageContent,
  Section,
} from "@/components/Layout";
import { LineItemTable } from "@/components/LineItemTable";
import NoSSR from "@/components/NoSSR";
import { FederalDepartmentMiniSankey } from "@/components/Sankey/FederalDepartmentMiniSankey";
import { StatCard, StatCardContainer } from "@/components/StatCard";
import { YearSelector } from "@/components/YearSelector";
import {
  getFederalDepartment,
  getFederalDepartmentProse,
  getFederalDepartmentSlugs,
  getFederalSummary,
  getFederalYears,
  getHistoricalPre2013,
  isValidFederalYear,
} from "@/lib/federal";
import { formatNumber } from "@/components/Sankey/utils";
import { initLingui } from "@/initLingui";
import { locales } from "@/lib/constants";
import { localizedPath } from "@/lib/utils";
import { Trans } from "@lingui/react/macro";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export async function generateStaticParams() {
  const years = getFederalYears();
  return locales.flatMap((lang) =>
    years.flatMap((year) =>
      getFederalDepartmentSlugs(year).map((department) => ({
        lang,
        year: String(year),
        department,
      })),
    ),
  );
}

// Minimal, safe markdown-ish rendering for committed prose (spec §9). Numbers
// are interpolated from JSON placeholders; the prose itself carries no figures.
function renderProse(markdown: string, values: Record<string, string>): string {
  // Reviewer-facing HTML comments (verification notes) never reach the DOM.
  const withoutComments = markdown.replace(/<!--[\s\S]*?-->/g, "").trim();
  const interpolated = withoutComments.replace(
    /\{\{\s*([\w.]+)\s*\}\}/g,
    (_m, key) => values[key] ?? "",
  );
  return interpolated;
}

export default async function FederalDepartmentPage({
  params,
}: {
  params: Promise<{ lang: string; year: string; department: string }>;
}) {
  const { lang, year, department: slug } = await params;
  initLingui(lang);

  if (!isValidFederalYear(year)) {
    notFound();
  }

  const department = getFederalDepartment(year, slug, lang);
  const summary = getFederalSummary(year);
  if (!department || !summary) {
    notFound();
  }

  const yearNum = Number(year);

  // Year toggle: link to the same slug in years that have it; otherwise link
  // to that year's overview (machinery-of-government change).
  const yearItems = getFederalYears().map((y) => {
    const has = getFederalDepartmentSlugs(y).includes(slug);
    return {
      year: y,
      current: y === yearNum,
      unavailable: !has,
      href: has
        ? localizedPath(`/federal/spending/${y}/${slug}`, lang)
        : localizedPath(`/federal/spending/${y}`, lang),
    };
  });

  // Historical share: merge static pre-2013 points (spec §12) for legacy slugs.
  const historical = getHistoricalPre2013();
  const pre2013 = historical?.departments?.[slug] ?? [];
  const byYear = new Map<number, number>();
  for (const p of pre2013) {
    if (p.year < 2013) byYear.set(p.year, p.percentage);
  }
  for (const p of department.historicalShare) {
    byYear.set(p.year, p.percentage);
  }
  const shareData = Array.from(byYear.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([y, percentage]) => ({ Year: String(y), Percentage: percentage }));

  const entityItems = department.entities.map((e) => ({
    key: e.id ?? e.name,
    name: e.name,
    value: e.value,
  }));

  const prose = getFederalDepartmentProse(year, slug, lang);
  const proseHtml =
    prose && prose.reviewed
      ? renderProse(prose.content, {
          name: department.name,
          totalSpending: formatNumber(department.totalSpending, 1e9),
          percentageOfFederal: `${department.percentageOfFederal.toFixed(1)}%`,
        })
      : null;

  const methodologyPath = localizedPath("/federal/spending/methodology", lang);
  const otherMinistries = summary.ministries.filter((m) => m.slug !== slug);

  return (
    <Page>
      <PageContent>
        <InflationProvider
          multiplierToBase={summary.inflation?.multiplierToBase ?? 1}
          baseYear={summary.inflation?.baseYear ?? yearNum}
        >
          <Section>
            <H1>{department.name}</H1>
            <Intro>
              <Trans>
                How {department.name} spent its budget in fiscal year{" "}
                {summary.financialYear}, on a Volume II appropriations basis.
              </Trans>
            </Intro>
          </Section>

          <Section>
            <YearSelector
              items={yearItems}
              label={<Trans>Fiscal year</Trans>}
            />
            {department.reportedAs && (
              <div className="mt-3">
                <UpdatedAt>
                  <Trans>
                    In FY {summary.financialYear} this was reported as{" "}
                    {department.reportedAs}.
                  </Trans>
                </UpdatedAt>
              </div>
            )}
          </Section>

          <Section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <H2>
                <Trans>Department Spending</Trans>
              </H2>
              <InflationToggle />
            </div>
            <StatCardContainer>
              <StatCard
                title={<Trans>In FY {summary.financialYear},</Trans>}
                value={<InflationValue nominal={department.totalSpending} />}
                subtitle={<Trans>was spent by {department.name}</Trans>}
              />
              <StatCard
                title={<Trans>In FY {summary.financialYear},</Trans>}
                value={`${department.percentageOfFederal.toFixed(1)}%`}
                subtitle={
                  <Trans>of federal spending was by {department.name}</Trans>
                }
              />
            </StatCardContainer>
          </Section>

          {proseHtml && (
            <Section>
              {proseHtml.split("\n\n").map((paragraph, index) => (
                <P key={index}>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: paragraph
                        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                        .replace(
                          /\[([^\]]+)\]\(([^)]+)\)/g,
                          '<a href="$2" class="text-blue-500 underline hover:text-blue-600" target="_blank" rel="noopener noreferrer">$1</a>',
                        ),
                    }}
                  />
                </P>
              ))}
            </Section>
          )}

          <Section>
            <H2>
              <Trans>
                How did {department.name} spend its budget in{" "}
                {summary.financialYear}?
              </Trans>
            </H2>
            <ChartContainer>
              <NoSSR>
                <FederalDepartmentMiniSankey
                  spendingData={department.miniSankey.spending_data}
                />
              </NoSSR>
            </ChartContainer>
            <H3>
              <Trans>Spending by entity, FY {summary.financialYear}</Trans>
            </H3>
            <ChartContainer>
              <BillionsBarList items={entityItems} />
            </ChartContainer>
          </Section>

          {shareData.length > 1 && (
            <Section>
              <H2>
                <Trans>
                  {department.name}&rsquo;s share of federal spending
                </Trans>
              </H2>
              <H3>
                <Trans>
                  Percentage of federal spending, {shareData[0].Year}–
                  {shareData[shareData.length - 1].Year}
                </Trans>
              </H3>
              <ChartContainer>
                <HistoricalShareChart data={shareData} />
              </ChartContainer>
            </Section>
          )}

          <Section>
            <H2>
              <Trans>Line items</Trans>
            </H2>
            <P>
              <Trans>
                Complete appropriation (vote/allotment) and transfer-payment
                lines, in dollars. Search, sort, and download the full table.
              </Trans>
            </P>
            <LineItemTable
              votes={department.votes}
              transferPayments={department.transferPayments}
              slug={department.slug}
              year={yearNum}
            />
          </Section>

          {otherMinistries.length > 0 && (
            <Section>
              <H2>
                <Trans>Explore other federal departments</Trans>
              </H2>
              <div className="text-gray-600 leading-relaxed">
                {otherMinistries.map((m) => (
                  <div key={m.slug} className="py-3 border-b border-gray-200">
                    <InternalLink
                      href={`/federal/spending/${year}/${m.slug}`}
                      lang={lang}
                      className="font-medium text-gray-600"
                    >
                      {m.name}
                    </InternalLink>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section>
            <P className="text-sm text-foreground/60">
              <Trans>
                {department.name} figures are on a Volume II appropriations
                basis and will not match the Volume I consolidated headline
                totals. See the{" "}
                <InternalLink href={methodologyPath}>methodology</InternalLink>{" "}
                for details.
              </Trans>
            </P>
          </Section>
        </InflationProvider>
      </PageContent>
    </Page>
  );
}
