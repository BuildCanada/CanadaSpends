"use client";

import { DepartmentList } from "@/components/DepartmentList";
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
import { BudgetSankey } from "@/components/Sankey/BudgetSankey";
import { Trans } from "@lingui/react/macro";
import { useState, useCallback } from "react";
import { NewsItem, budgetNewsData } from "@/lib/budgetNewsData";
import { IS_BUDGET_2025_LIVE } from "@/lib/featureFlags";
import Link from "next/link";

const StatBox = ({
  title,
  value,
  description,
  growthPercentage,
}: {
  title: React.ReactNode;
  value: string;
  description: React.ReactNode;
  growthPercentage?: number;
}) => (
  <div className="flex flex-col mr-8 mb-8">
    <div className="text-sm text-gray-600 mb-1">{title}</div>
    <div className="text-3xl font-bold mb-1">{value}</div>
    <div className="text-sm text-gray-600">{description}</div>
    {growthPercentage && (
      <div
        className={`text-xs py-1 font-medium ${growthPercentage > 0 ? "text-green-600" : "text-red-600"}`}
      >
        {growthPercentage > 0 ? "+" : ""}
        {growthPercentage}% over the last year
      </div>
    )}
  </div>
);

// Reusable News Table Component
const NewsTable = ({ newsData }: { newsData: NewsItem[] }) => (
  <div className="overflow-x-auto mt-6">
    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <Trans>News Source & Date</Trans>
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <Trans>Budget Impact</Trans>
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <Trans>Amount/Change</Trans>
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {newsData.map((item) => (
          <tr key={item.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm">
                <ExternalLink
                  href={item.url}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {item.source} - {item.date}
                </ExternalLink>
                <p className="text-gray-500 text-xs mt-1">{item.headline}</p>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {item.budgetImpact}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  item.isIncrease
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {item.isIncrease ? "+" : "-"}
                {item.amount} ({item.isIncrease ? "+" : ""}
                {item.percentage}%)
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const calculateGrowthPercentage = (
  current: number,
  previous: number,
): number => {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
};

type BudgetPageContentProps = {
  budgetPath: string;
  fullScreenPath: string;
  contactPath: string;
  locale?: string;
};

export function BudgetPageContent({
  budgetPath,
  fullScreenPath,
  contactPath,
  locale,
}: BudgetPageContentProps) {
  const [budgetData, setBudgetData] = useState({
    spending: 513.9,
    revenue: 459.5,
    deficit: 54.4,
    opex2024: 0,
    capex2024: 0,
    opex2025: 0,
    capex2025: 0,
    transfers2024: 0,
    transfers2025: 0,
    debt2024: 0,
    debt2025: 0,
    other2024: 0,
    other2025: 0,
  });

  const handleBudgetDataChange = useCallback(
    (data: {
      spending: number;
      revenue: number;
      deficit: number;
      opex2024: number;
      capex2024: number;
      opex2025: number;
      capex2025: number;
      transfers2024: number;
      transfers2025: number;
      debt2024: number;
      debt2025: number;
      other2024: number;
      other2025: number;
    }) => {
      setBudgetData(data);
    },
    [],
  );

  return (
    <Page>
      {/* Official Budget Banner - Only Show When Budget is Live */}
      {IS_BUDGET_2025_LIVE && (
        <div className="bg-indigo-950 text-white py-12 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <Trans>Official Fall 2025 Federal Budget Released</Trans>
            </h2>
            <Link
              href={budgetPath}
              className="inline-block bg-white text-indigo-950 hover:bg-gray-100 font-medium py-3 px-6 transition-colors"
            >
              <Trans>View Federal 2025 Budget Details</Trans>
            </Link>
          </div>
        </div>
      )}

      <PageContent>
        <Section>
          <H1>
            <Trans>Federal Fall 2025 Government Budget</Trans>
          </H1>
          <Intro>
            {IS_BUDGET_2025_LIVE ? (
              <Trans>
                This page presents the official Fall 2025 Federal Budget as
                released by the Government of Canada on November 4th, 2025. All
                data is sourced directly from official government publications
                and public accounts from the Government of Canada.
              </Trans>
            ) : (
              <Trans>
                The values you see here are based on the FY 2024 Budget with
                preliminary updates based on government announcements, memos,
                and leaks, and are meant to provide a rough idea of the budget.
                Once the official Fall 2025 Budget is released on November 4th,
                we will update this page to reflect the official budget.
              </Trans>
            )}
          </Intro>
        </Section>
        <Section>
          <H2>
            <Trans>Budget Statistics (Projected FY 2025)</Trans>
          </H2>
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${!IS_BUDGET_2025_LIVE ? "xl:grid-cols-5" : ""} gap-8 mb-8`}
          >
            <StatBox
              title={<Trans>Total Budget</Trans>}
              value={`$${budgetData.spending.toFixed(1)}B`}
              description={<Trans>Est. projected government budget</Trans>}
              growthPercentage={calculateGrowthPercentage(
                budgetData.spending,
                513.9,
              )}
            />
            <StatBox
              title={<Trans>Revenue</Trans>}
              value={`$${budgetData.revenue.toFixed(1)}B`}
              description={<Trans>Est. projected government revenue</Trans>}
              growthPercentage={calculateGrowthPercentage(
                budgetData.revenue,
                459.5,
              )}
            />
            {!IS_BUDGET_2025_LIVE && (
              <>
                <StatBox
                  title={<Trans>Operational Spend</Trans>}
                  value={`$${budgetData.opex2025.toFixed(1)}B`}
                  description={<Trans>Projected operational spending</Trans>}
                  growthPercentage={calculateGrowthPercentage(
                    budgetData.opex2025,
                    budgetData.opex2024,
                  )}
                />
                <StatBox
                  title={<Trans>Capital Investments</Trans>}
                  value={`$${budgetData.capex2025.toFixed(1)}B`}
                  description={<Trans>Projected capital investments</Trans>}
                  growthPercentage={calculateGrowthPercentage(
                    budgetData.capex2025,
                    budgetData.capex2024,
                  )}
                />
              </>
            )}
            <StatBox
              title={<Trans>Deficit</Trans>}
              value={`$${budgetData.deficit.toFixed(1)}B`}
              description={<Trans>Est. projected budget deficit</Trans>}
              growthPercentage={calculateGrowthPercentage(
                budgetData.deficit,
                54.4,
              )}
            />
          </div>
        </Section>
        <div className="sankey-chart-container relative overflow-hidden sm:(mr-0 ml-0) md:(min-h-[776px] min-w-[1280px] w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2)">
          <NoSSR>
            <BudgetSankey onDataChange={handleBudgetDataChange} />
          </NoSSR>
          <div className="absolute bottom-3 left-6">
            <ExternalLink
              className="text-xs text-gray-400"
              href="https://budget.canada.ca/2025/report-rapport/pdf/budget-2025.pdf"
            >
              Source
            </ExternalLink>
          </div>
          <div className="absolute top-0 left-0 w-[100vw] h-full  backdrop-blur-sm z-10 text-white md:hidden flex items-center justify-center">
            <ExternalLink
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              href={fullScreenPath}
            >
              <Trans>View this chart in full screen</Trans>
            </ExternalLink>
          </div>
        </div>
        <Section>
          <H2>
            <Trans>Latest Budget News & Impact</Trans>
          </H2>
          <P>
            <Trans>
              Recent developments and their projected impact on the Fall 2025
              Budget
            </Trans>
          </P>
          <NewsTable newsData={budgetNewsData} />
        </Section>

        <Section>
          <H2>
            <Trans>Government Departments Explained</Trans>
          </H2>
          <DepartmentList />
        </Section>
        <Section>
          <H2>
            <Trans>Sources</Trans>
          </H2>
          <P>
            <Trans>
              All government budget data is sourced from official databases, but
              due to the complexity of these systems, occasional errors may
              occur despite our best efforts. This page is also based on
              government memos and leaks, so it is not an official release of
              the Fall 2025 Budget. We aim to make this information more
              accessible and accurate, and we welcome feedback. If you notice
              any issues, please let us know{" "}
              <InternalLink href={contactPath} lang={locale}>
                here
              </InternalLink>{" "}
              — we appreciate it and will work to address them promptly.
            </Trans>
          </P>
        </Section>
      </PageContent>
    </Page>
  );
}

export default function Budget() {
  return (
    <BudgetPageContent
      budgetPath="/federal/budget"
      fullScreenPath="/federal/budget-full-screen"
      contactPath="/contact"
    />
  );
}
