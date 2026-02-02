"use client";

import { Trans } from "@lingui/react/macro";
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
import { RemunerationTable } from "./RemunerationTable";
import { FinancialPositionStats } from "./FinancialPositionStats";
import { BandNotes } from "./BandNotes";
import { BandYearSelector } from "./BandYearSelector";
import {
  statementOfOperationsToSankey,
  extractOperationsSummary,
} from "@/lib/supabase/sankey-transform";
import type { SankeyData } from "@/components/Sankey/SankeyChartD3";
import type {
  BandInfo,
  StatementOfOperations,
  StatementOfFinancialPosition,
  Remuneration,
  Notes,
} from "@/lib/supabase/types";

interface BandPageContentProps {
  band: BandInfo;
  year: string;
  statementOfOperations: StatementOfOperations | null;
  statementOfFinancialPosition: StatementOfFinancialPosition | null;
  remuneration: Remuneration | null;
  notes: Notes | null;
  lang: string;
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
    strokeLinecap="round"
    strokeLinejoin="round"
    className="ml-2 text-gray-500 cursor-pointer"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

function formatFiscalYear(year: string): string {
  const yearNum = parseInt(year, 10);
  if (isNaN(yearNum)) return year;

  // Fiscal year ends in March, so FY 2024 = April 2023 - March 2024
  const startYear = yearNum - 1;
  return `${startYear}-${String(yearNum).slice(-2)}`;
}

function formatCurrency(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (absolute >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
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

export function BandPageContent({
  band,
  year,
  statementOfOperations,
  statementOfFinancialPosition,
  remuneration,
  notes,
  lang,
}: BandPageContentProps) {
  const fiscalYear = formatFiscalYear(year);

  // Generate sankey data if we have statement of operations
  const sankeyData: SankeyData | null = statementOfOperations
    ? statementOfOperationsToSankey(statementOfOperations)
    : null;

  // Build financial summary stats from statement of operations
  const financialStats: {
    key: string;
    title: React.ReactNode;
    value: React.ReactNode;
    description: React.ReactNode;
  }[] = [];

  if (statementOfOperations) {
    const summary = extractOperationsSummary(
      statementOfOperations,
      parseInt(year, 10),
    );

    const surplusLabel =
      summary.surplusDeficit >= 0
        ? `${formatCurrency(summary.surplusDeficit)} surplus`
        : `${formatCurrency(Math.abs(summary.surplusDeficit))} deficit`;

    financialStats.push(
      {
        key: "surplus-deficit",
        title: (
          <div className="flex items-center">
            <Trans>Surplus/Deficit</Trans>
            <Tooltip
              text={
                <Trans>
                  The difference between total revenue and total expenses. A
                  surplus indicates revenue exceeded expenses.
                </Trans>
              }
            >
              <HelpIcon />
            </Tooltip>
          </div>
        ),
        value: surplusLabel,
        description: <Trans>Balance for FY {fiscalYear}</Trans>,
      },
      {
        key: "total-revenue",
        title: (
          <div className="flex items-center">
            <Trans>Total Revenue</Trans>
            <Tooltip
              text={
                <Trans>
                  All revenue collected during the fiscal year, including
                  transfers, own-source revenue, and other funding.
                </Trans>
              }
            >
              <HelpIcon />
            </Tooltip>
          </div>
        ),
        value: formatCurrency(summary.totalRevenue),
        description: <Trans>Total revenue in FY {fiscalYear}</Trans>,
      },
      {
        key: "total-expenses",
        title: (
          <div className="flex items-center">
            <Trans>Total Expenses</Trans>
            <Tooltip
              text={
                <Trans>
                  All expenses incurred during the fiscal year including program
                  delivery, administration, and capital costs.
                </Trans>
              }
            >
              <HelpIcon />
            </Tooltip>
          </div>
        ),
        value: formatCurrency(summary.totalExpenses),
        description: <Trans>Total expenses in FY {fiscalYear}</Trans>,
      },
    );
  }

  return (
    <Page>
      <PageContent>
        <Section>
          <H1>{band.name}</H1>
          <Intro>
            <Trans>
              Financial data for {band.name} for fiscal year {fiscalYear}.
              Information is extracted from publicly available annual reports
              published under the First Nations Financial Transparency Act.
            </Trans>
          </Intro>
        </Section>

        {/* Statement of Operations - Sankey Chart */}
        {sankeyData && sankeyData.total > 0 && (
          <>
            <Section>
              <H2>
                <Trans>Revenue and Expenses FY {fiscalYear}</Trans>
              </H2>
              <P>
                <Trans>
                  Visual breakdown of {band.name}&apos;s revenue sources and how
                  funds were spent during fiscal year {fiscalYear}.
                </Trans>
              </P>
            </Section>
            <div className="sankey-chart-container relative overflow-hidden sm:(mr-0 ml-0) md:(min-h-[776px] min-w-[1280px] w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2)">
              <JurisdictionSankey data={sankeyData} amountScalingFactor={1} />
            </div>
          </>
        )}

        {/* Financial Summary Stats */}
        {financialStats.length > 0 && (
          <Section>
            <H2>
              <Trans>Financial Summary FY {fiscalYear}</Trans>
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
        )}

        {/* Statement of Financial Position */}
        {statementOfFinancialPosition && (
          <Section>
            <H2>
              <Trans>Statement of Financial Position</Trans>
            </H2>
            <P>
              <Trans>
                Assets, liabilities, and net financial position as of the end of
                fiscal year {fiscalYear}.
              </Trans>
            </P>
            <FinancialPositionStats
              data={statementOfFinancialPosition}
              fiscalYear={fiscalYear}
            />
          </Section>
        )}

        {/* Remuneration */}
        {remuneration &&
          remuneration.entries &&
          remuneration.entries.length > 0 && (
            <Section>
              <H2>
                <Trans>Remuneration and Expenses</Trans>
              </H2>
              <P>
                <Trans>
                  Salaries, honoraria, travel, and other expenses paid to
                  elected officials and senior employees during fiscal year{" "}
                  {fiscalYear}.
                </Trans>
              </P>
              <RemunerationTable data={remuneration} />
            </Section>
          )}

        {/* Notes */}
        {notes && notes.notes && notes.notes.length > 0 && (
          <Section>
            <H2>
              <Trans>Notes to Financial Statements</Trans>
            </H2>
            <BandNotes data={notes} />
          </Section>
        )}

        {/* Year Selector */}
        <Section>
          <BandYearSelector
            bcid={band.bcid}
            currentYear={year}
            availableYears={band.availableYears}
            lang={lang}
          />
        </Section>

        {/* Sources */}
        <Section>
          <H2>
            <Trans>Sources</Trans>
          </H2>
          <P>
            <Trans>
              Financial data is sourced from annual reports published under the
              First Nations Financial Transparency Act (FNFTA). Data is
              extracted using automated processes and may contain errors. If you
              notice any issues, please contact us.
            </Trans>
          </P>
        </Section>
      </PageContent>
    </Page>
  );
}
