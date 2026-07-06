import UpdatedAt from "@/app/[lang]/(main)/federal/spending/_common/updatedAt";
import { BillionsBarList } from "@/components/BillionsBarList";
import { FederalWorkforce } from "@/components/FederalWorkforce";
import {
  InflationProvider,
  InflationValue,
} from "@/components/InflationContext";
import { InflationToggle } from "@/components/InflationToggle";
import {
  ExternalLink,
  H1,
  H2,
  InternalLink,
  Intro,
  P,
  Page,
  PageContent,
  Section,
} from "@/components/Layout";
import NoSSR from "@/components/NoSSR";
import { FederalSankey } from "@/components/Sankey/FederalSankey";
import { StatCard, StatCardContainer } from "@/components/StatCard";
import { YearSelector } from "@/components/YearSelector";
import {
  getFederalIndex,
  getFederalSankey,
  getFederalLatestYear,
  getFederalSummary,
  getFederalYears,
  isValidFederalYear,
} from "@/lib/federal";
import { initLingui } from "@/initLingui";
import { locales } from "@/lib/constants";
import { localizedPath } from "@/lib/utils";
import { Trans } from "@lingui/react/macro";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export async function generateStaticParams() {
  const years = getFederalYears();
  return locales.flatMap((lang) =>
    years.map((year) => ({ lang, year: String(year) })),
  );
}

export default async function FederalYearOverview({
  params,
}: {
  params: Promise<{ lang: string; year: string }>;
}) {
  const { lang, year } = await params;
  initLingui(lang);

  if (!isValidFederalYear(year)) {
    notFound();
  }

  const summary = getFederalSummary(year);
  const sankey = getFederalSankey(year, lang);
  if (!summary || !sankey) {
    notFound();
  }

  const yearNum = Number(year);
  const index = getFederalIndex();
  const years = getFederalYears();

  const yearItems = years.map((y) => ({
    year: y,
    href: localizedPath(`/federal/spending/${y}`, lang),
    current: y === yearNum,
  }));

  const ministryItems = summary.ministries
    .map((m) => ({
      key: m.slug,
      name: m.name,
      value: m.totalSpending,
      href: localizedPath(`/federal/spending/${year}/${m.slug}`, lang),
    }))
    .sort((a, b) => b.value - a.value);

  const methodologyPath = localizedPath("/federal/spending/methodology", lang);
  const isLatestYear = yearNum === getFederalLatestYear();

  return (
    <Page>
      <PageContent>
        <InflationProvider
          multiplierToBase={summary.inflation?.multiplierToBase ?? 1}
          baseYear={summary.inflation?.baseYear ?? yearNum}
        >
          <Section>
            <H1>
              <Trans>Federal Government Spending</Trans>
            </H1>
            <Intro>
              <Trans>
                Get data-driven insights into how the federal government&rsquo;s
                revenue and spending affect Canadian lives and programs.
              </Trans>
            </Intro>
          </Section>

          <Section>
            <YearSelector
              items={yearItems}
              label={<Trans>Fiscal year</Trans>}
            />
            {index?.updatedAt && (
              <div className="mt-3">
                <UpdatedAt>
                  <Trans>
                    Data updated{" "}
                    {new Date(index.updatedAt).toLocaleDateString(
                      lang === "fr" ? "fr-CA" : "en-CA",
                      { year: "numeric", month: "long", day: "numeric" },
                    )}
                  </Trans>
                </UpdatedAt>
              </div>
            )}
          </Section>

          <Section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <H2>
                <Trans>FY {summary.financialYear} Revenue and Spending</Trans>
              </H2>
              <InflationToggle />
            </div>
            <P>
              <Trans>
                Headline totals are on a Volume I consolidated (accrual) basis.
                Explore revenue and spending categories below.
              </Trans>
            </P>
            <StatCardContainer>
              <StatCard
                title={
                  <Trans>Total spending in FY {summary.financialYear}</Trans>
                }
                value={<InflationValue nominal={summary.totalSpending} />}
                subtitle={<Trans>consolidated federal spending (Vol I)</Trans>}
              />
              <StatCard
                title={
                  <Trans>Total revenue in FY {summary.financialYear}</Trans>
                }
                value={<InflationValue nominal={summary.totalRevenue} />}
                subtitle={<Trans>consolidated federal revenue (Vol I)</Trans>}
              />
              <StatCard
                title={<Trans>Deficit in FY {summary.financialYear}</Trans>}
                value={<InflationValue nominal={summary.deficit} />}
                subtitle={<Trans>revenue minus spending (Vol I)</Trans>}
              />
            </StatCardContainer>
          </Section>

          <div className="sankey-chart-container relative overflow-hidden sm:(mr-0 ml-0) md:(min-h-[776px] min-w-[1280px] w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2)">
            <NoSSR>
              <FederalSankey data={sankey} />
            </NoSSR>
            <div className="absolute bottom-3 left-6 text-xs text-gray-400">
              <span className="mr-2">
                <Trans>Total spending:</Trans>{" "}
                <InflationValue nominal={summary.totalSpending} />
              </span>
              <ExternalLink
                className="text-xs text-gray-400"
                href={summary.source_url}
              >
                <Trans>Source</Trans>
              </ExternalLink>
            </div>
            <div className="absolute top-0 left-0 w-[100vw] h-full backdrop-blur-sm z-10 text-white md:hidden flex items-center justify-center">
              <ExternalLink
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                href={localizedPath(
                  `/federal/spending-full-screen/${year}`,
                  lang,
                )}
              >
                <Trans>View this chart in full screen</Trans>
              </ExternalLink>
            </div>
          </div>

          <Section>
            <H2>
              <Trans>Spending by ministry, FY {summary.financialYear}</Trans>
            </H2>
            <P>
              <Trans>
                Ministry totals are on a Volume II appropriations basis. Select
                a ministry for its programs, entities, and line items.
              </Trans>
            </P>
            <BillionsBarList items={ministryItems} />
          </Section>

          {isLatestYear && <FederalWorkforce />}

          <Section>
            <P className="text-sm text-foreground/60">
              <Trans>
                Headline totals use the Volume I consolidated basis; ministry
                and department figures use the Volume II appropriations basis.
                These bases differ; see the{" "}
                <InternalLink href={methodologyPath}>methodology</InternalLink>{" "}
                for the reconciliation and known differences.
              </Trans>
            </P>
          </Section>
        </InflationProvider>
      </PageContent>
    </Page>
  );
}
