import { JurisdictionDepartmentList } from "@/components/DepartmentList";
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
import { JurisdictionSankey } from "@/components/Sankey/JurisdictionSankey";
import { Tooltip } from "@/components/Tooltip";
import { Jurisdiction, Department } from "@/lib/jurisdictions";
import { SankeyData } from "@/components/Sankey/SankeyChartD3";
import { localizedPath } from "@/lib/utils";
import { Trans } from "@lingui/react/macro";

const HelpIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="ml-2 text-gray-500 cursor-pointer"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

type SankeyNode = {
  name: string;
  amount?: number;
  children?: SankeyNode[];
};

interface JurisdictionPageContentProps {
  jurisdiction: Jurisdiction;
  sankey: SankeyData;
  departments: Department[];
  lang: string;
  basePath: string;
  fullScreenPath: string;
}

export function JurisdictionPageContent({
  jurisdiction,
  sankey,
  departments,
  lang,
  basePath,
  fullScreenPath,
}: JurisdictionPageContentProps) {
  const ministriesArray = (jurisdiction as { ministries?: unknown[] })
    .ministries;
  const ministriesCount = Array.isArray(ministriesArray)
    ? ministriesArray.length
    : 0;

  // Financial position figures (only available for provinces)
  const hasDebtData =
    jurisdiction.netDebt !== null &&
    jurisdiction.totalDebt !== null &&
    jurisdiction.debtInterest !== null;
  const netDebtFormatted = hasDebtData
    ? `$${jurisdiction.netDebt.toFixed(1)}B`
    : null;
  const totalDebtFormatted = hasDebtData
    ? `$${jurisdiction.totalDebt.toFixed(1)}B`
    : null;
  const interestOnDebtFormatted = hasDebtData
    ? `$${jurisdiction.debtInterest.toFixed(1)}B`
    : null;

  const sumNode = (node?: SankeyNode): number => {
    if (!node) {
      return 0;
    }
    if (node.children && node.children.length > 0) {
      return node.children.reduce((acc, child) => acc + sumNode(child), 0);
    }
    return typeof node.amount === "number" ? node.amount : 0;
  };

  const totalRevenue = sankey.revenue ?? 0;
  const totalSpending = sankey.spending ?? 0;
  const budgetBalance = totalRevenue - totalSpending;
  const population =
    (jurisdiction as { population?: number }).population ??
    (sankey as { population?: number }).population ??
    null;

  const formatBillions = (value: number) => {
    const absolute = Math.abs(value);
    const formatted =
      absolute >= 1
        ? `$${absolute.toFixed(2)}B`
        : `$${(absolute * 1000).toFixed(0)}M`;
    return formatted.replace(".00B", "B");
  };

  const perCapitaSpending = population
    ? Math.round((totalSpending * 1_000_000_000) / population)
    : null;

  const revenueRoot = sankey.revenue_data as SankeyNode | undefined;
  const propertyTaxNode = revenueRoot?.children?.find(
    (child) =>
      child.name === "Property taxes & taxation from other governments" ||
      "Property tax and business taxes",
  );
  const propertyTaxTotal = propertyTaxNode ? sumNode(propertyTaxNode) : null;
  const propertyTaxPerCapita =
    population && propertyTaxTotal !== null
      ? Math.round((propertyTaxTotal * 1_000_000_000) / population)
      : null;

  const budgetValue = `${formatBillions(Math.abs(budgetBalance))} ${
    budgetBalance >= 0 ? "surplus" : "deficit"
  }`;

  const financialStats: {
    key: string;
    title: React.ReactNode;
    value: React.ReactNode;
    description: React.ReactNode;
  }[] = [
    {
      key: "budget-balance",
      title: (
        <div className="flex items-center">
          <Trans>Surplus/Deficit</Trans>
          <Tooltip
            text={
              <Trans>
                The difference between revenue and spending. A surplus indicates
                revenue exceeded spending.
              </Trans>
            }
          >
            <HelpIcon />
          </Tooltip>
        </div>
      ),
      value: budgetValue,
      description: <Trans>Balance for {jurisdiction.financialYear}</Trans>,
    },
    {
      key: "total-revenue",
      title: (
        <div className="flex items-center">
          <Trans>Total Revenue</Trans>
          <Tooltip
            text={
              <Trans>
                All revenue collected during the fiscal year, including taxes,
                transfers, and other sources.
              </Trans>
            }
          >
            <HelpIcon />
          </Tooltip>
        </div>
      ),
      value: formatBillions(totalRevenue),
      description: <Trans>Total revenue in {jurisdiction.financialYear}</Trans>,
    },
    {
      key: "total-spending",
      title: (
        <div className="flex items-center">
          <Trans>Total Spending</Trans>
          <Tooltip
            text={
              <Trans>
                All program and operating spending recorded for the fiscal year.
              </Trans>
            }
          >
            <HelpIcon />
          </Tooltip>
        </div>
      ),
      value: formatBillions(totalSpending),
      description: (
        <Trans>Total spending in {jurisdiction.financialYear}</Trans>
      ),
    },
  ];

  if (
    hasDebtData &&
    netDebtFormatted &&
    totalDebtFormatted &&
    interestOnDebtFormatted
  ) {
    financialStats.push(
      {
        key: "net-debt",
        title: (
          <div className="flex items-center">
            <Trans>Net Debt</Trans>
            <Tooltip
              text={
                <Trans>
                  Net Debt is what remains after subtracting financial assets
                  (like cash and investments) from the Total Debt. It represents
                  the debt that isn't immediately covered by liquid assets.
                </Trans>
              }
            >
              <HelpIcon />
            </Tooltip>
          </div>
        ),
        value: netDebtFormatted,
        description: (
          <Trans>As of fiscal year end {jurisdiction.financialYear}</Trans>
        ),
      },
      {
        key: "total-debt",
        title: (
          <div className="flex items-center">
            <Trans>Total Debt</Trans>
            <Tooltip
              text={
                <Trans>
                  Total Debt is the government's complete outstanding debt. This
                  is the figure on which interest payments are calculated.
                </Trans>
              }
            >
              <HelpIcon />
            </Tooltip>
          </div>
        ),
        value: totalDebtFormatted,
        description: (
          <Trans>As of fiscal year end {jurisdiction.financialYear}</Trans>
        ),
      },
      {
        key: "interest",
        title: (
          <div className="flex items-center">
            <Trans>Interest on Debt</Trans>
            <Tooltip
              text={
                <Trans>
                  Annual interest payments on outstanding debt. This represents
                  the cost of servicing the province's debt obligations.
                </Trans>
              }
            >
              <HelpIcon />
            </Tooltip>
          </div>
        ),
        value: interestOnDebtFormatted,
        description: (
          <Trans>
            Annual interest expense for {jurisdiction.financialYear}
          </Trans>
        ),
      },
    );
  }

  if (perCapitaSpending !== null) {
    financialStats.push({
      key: "per-capita-spending",
      title: (
        <div className="flex items-center">
          <Trans>Per Capita Spending</Trans>
          <Tooltip
            text={
              <Trans>
                Total spending divided by population. Useful for comparing
                municipal efficiency across cities.
              </Trans>
            }
          >
            <HelpIcon />
          </Tooltip>
        </div>
      ),
      value: (
        <>
          ${perCapitaSpending.toLocaleString("en-CA")}{" "}
          <Trans>per resident</Trans>
        </>
      ),
      description: (
        <Trans>
          Annual municipal spending per {jurisdiction.name} resident
        </Trans>
      ),
    });
  }

  if (propertyTaxPerCapita !== null) {
    financialStats.push({
      key: "property-tax-per-capita",
      title: (
        <div className="flex items-center">
          <Trans>Property Tax Per Capita</Trans>
          <Tooltip
            text={
              <Trans>
                Total property tax revenue divided by population. Primary
                revenue source for municipalities.
              </Trans>
            }
          >
            <HelpIcon />
          </Tooltip>
        </div>
      ),
      value: (
        <>
          ${propertyTaxPerCapita.toLocaleString("en-CA")}{" "}
          <Trans>per resident</Trans>
        </>
      ),
      description: (
        <Trans>Property tax revenue per {jurisdiction.name} resident</Trans>
      ),
    });
  }

  return (
    <Page>
      <PageContent>
        <Section>
          <H1>
            <Trans>{jurisdiction.name} Government Spending</Trans>
          </H1>
          <Intro>
            <Trans>
              Get data-driven insights into how the {jurisdiction.name}{" "}
              government&rsquo;s revenue and spending affect {jurisdiction.name}{" "}
              residents and programs.
            </Trans>
          </Intro>
        </Section>
        <Section>
          <H2>
            <Trans>
              {jurisdiction.name}'s Revenue and Spending in Financial Year{" "}
              {jurisdiction.financialYear}
            </Trans>
          </H2>
          <P>
            <Trans>
              Look back at what {jurisdiction.name}'s government made and spent.{" "}
              {["Toronto", "Vancouver"].includes(jurisdiction.name) && (
                <Trans>Numbers are reported on an accrual basis.</Trans>
              )}
            </Trans>
          </P>
        </Section>
        <div className="sankey-chart-container relative overflow-hidden sm:(mr-0 ml-0) md:(min-h-[776px] min-w-[1280px] w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2)">
          <JurisdictionSankey
            data={sankey}
            jurisdictionSlug={jurisdiction.slug}
          />
          <div className="absolute bottom-3 left-6">
            <ExternalLink
              className="text-xs text-gray-400"
              href={
                jurisdiction.sources && jurisdiction.sources.length > 0
                  ? jurisdiction.sources[0].url
                  : jurisdiction.source
              }
            >
              <Trans>Source</Trans>
            </ExternalLink>
          </div>
          <div className="absolute top-0 left-0 w-[100vw] h-full  backdrop-blur-sm z-10 text-white md:hidden flex items-center justify-center">
            <ExternalLink
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              href={localizedPath(fullScreenPath, lang)}
            >
              <Trans>View this chart in full screen</Trans>
            </ExternalLink>
          </div>
        </div>
        <Section>
          <H2>
            <Trans>Financial Position {jurisdiction.financialYear}</Trans>
          </H2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {financialStats.map((stat) => (
              <StatBox
                key={stat.key}
                title={stat.title}
                value={stat.value}
                description={stat.description}
              />
            ))}
          </div>
        </Section>
        <Section>
          <H2>
            <Trans>{jurisdiction.name} Government Workforce</Trans>
          </H2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jurisdiction.totalEmployees != null && (
              <StatBox
                title={<Trans>Public Service Employees</Trans>}
                value={jurisdiction.totalEmployees.toLocaleString("en-CA")}
                description={<Trans>Estimated public service workforce</Trans>}
              />
            )}

            <StatBox
              title={<Trans>Ministries + Agencies</Trans>}
              value={(departments.length || ministriesCount).toLocaleString(
                "en-CA",
              )}
              description={<Trans>Government organizations</Trans>}
            />
          </div>
          {jurisdiction.sources && jurisdiction.sources.length > 0 ? (
            <div className="text-sm mt-4">
              <span className="font-medium">
                <Trans>Sources:</Trans>
              </span>
              <ul className="mt-2 space-y-1">
                {jurisdiction.sources.map((src, idx) => (
                  <li key={idx}>
                    <ExternalLink href={src.url}>{src.label}</ExternalLink>
                    {src.scope && (
                      <span className="text-gray-500"> — {src.scope}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <P className="text-sm mt-4">
              <Trans>Sources:</Trans>{" "}
              <ExternalLink href={jurisdiction.source}>
                <Trans>
                  Public Accounts of {jurisdiction.name} FY{" "}
                  {jurisdiction.financialYear}
                </Trans>
              </ExternalLink>
            </P>
          )}
        </Section>
        {departments && departments.length > 0 && (
          <Section>
            <H2>
              <Trans>
                {jurisdiction.name} Government Departments explained
              </Trans>
            </H2>
            <JurisdictionDepartmentList
              jurisdiction={jurisdiction}
              lang={lang}
              departments={departments}
              basePath={basePath}
            />
          </Section>
        )}
        {jurisdiction.methodology && (
          <Section>
            <H2>
              <Trans>Methodology</Trans>
            </H2>
            {jurisdiction.methodology.split("\n\n").map((paragraph, index) => (
              <P key={index}>
                {paragraph.match(/\*\*([^*]+)\*\*/) ||
                paragraph.match(/\[([^\]]+)\]\(([^)]+)\)/) ? (
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
                ) : (
                  <Trans>{paragraph}</Trans>
                )}
              </P>
            ))}
          </Section>
        )}
        <Section>
          <H2>
            <Trans>Sources</Trans>
          </H2>
          <P>
            <Trans>
              All government spending data is sourced from official databases,
              but due to the complexity of these systems, occasional errors may
              occur despite our best efforts. We aim to make this information
              more accessible and accurate, and we welcome feedback. If you
              notice any issues, please let us know{" "}
              <InternalLink href="/contact" lang={lang}>
                here
              </InternalLink>{" "}
              — we appreciate it and will work to address them promptly.
            </Trans>
          </P>
        </Section>
        {jurisdiction.credits && (
          <Section className="text-center text-sm">
            <hr className="my-8"></hr>
            {jurisdiction.credits.split("\n\n").map((paragraph, index) => (
              <P key={index}>
                {paragraph.match(/\*\*([^*]+)\*\*/) ||
                paragraph.match(/\[([^\]]+)\]\(([^)]+)\)/) ? (
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
                ) : (
                  <Trans>{paragraph}</Trans>
                )}
              </P>
            ))}
          </Section>
        )}
      </PageContent>
    </Page>
  );
}

const StatBox = ({
  title,
  value,
  description,
}: {
  title: React.ReactNode;
  value: React.ReactNode;
  description: React.ReactNode;
}) => (
  <div className="flex flex-col mr-8 mb-8">
    <div className="text-sm text-gray-600 mb-1">{title}</div>
    <div className="text-3xl font-bold mb-1">{value}</div>
    <div className="text-sm text-gray-600">{description}</div>
  </div>
);
