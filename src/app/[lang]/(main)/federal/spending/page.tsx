"use client";

import { TenureChart } from "@/app/[lang]/(main)/federal/spending/TenureChart";
import { SalaryDistributionChart } from "@/app/[lang]/(main)/federal/spending/SalaryDistributionChart";
import { BarChart } from "@/components/BarChart";
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
import { Sankey } from "@/components/Sankey";
import { Trans, useLingui } from "@lingui/react/macro";
import { localizedPath } from "@/lib/utils";

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
        className={`text-xs font-medium ${growthPercentage > 0 ? "text-green-600" : "text-red-600"}`}
      >
        {growthPercentage > 0 ? "+" : ""}
        {growthPercentage}% over the last 5 years
      </div>
    )}
  </div>
);

const ageData = [
  { name: "<20", Count: 1756 },
  { name: "20-24", Count: 33596 },
  { name: "25-29", Count: 78800 },
  { name: "30-34", Count: 89426 },
  { name: "35-39", Count: 187657 },
  { name: "40-44", Count: 216806 },
  { name: "45-49", Count: 216024 },
  { name: "50-54", Count: 190226 },
  { name: "55-59", Count: 146872 },
  { name: "60-64", Count: 84865 },
  { name: "65+", Count: 39494 },
];

const calculateGrowthPercentage = (dataType: string) => {
  const headcountData = [
    { Year: "2019", Value: 382107 },
    { Year: "2020", Value: 390798 },
    { Year: "2021", Value: 413424 },
    { Year: "2022", Value: 431739 },
    { Year: "2023", Value: 440985 },
  ];

  const wagesData = [
    { Year: "2019", Value: 46.3 },
    { Year: "2020", Value: 53.0 },
    { Year: "2021", Value: 60.7 },
    { Year: "2022", Value: 56.5 },
    { Year: "2023", Value: 65.3 },
  ];

  const compensationData = [
    { Year: "2019", Value: 117522 },
    { Year: "2020", Value: 123163 },
    { Year: "2021", Value: 125256 },
    { Year: "2022", Value: 126634 },
    { Year: "2023", Value: 136345 },
  ];

  if (dataType === "headcount") {
    const oldValue = headcountData[0].Value;
    const newValue = headcountData[headcountData.length - 1].Value;
    return Number((((newValue - oldValue) / oldValue) * 100).toFixed(1));
  } else if (dataType === "wages") {
    const oldValue = wagesData[0].Value;
    const newValue = wagesData[wagesData.length - 1].Value;
    return Number((((newValue - oldValue) / oldValue) * 100).toFixed(1));
  } else if (dataType === "compensation") {
    const oldValue = compensationData[0].Value;
    const newValue = compensationData[compensationData.length - 1].Value;
    return Number((((newValue - oldValue) / oldValue) * 100).toFixed(1));
  }
  return 0;
};

type SpendingPageContentProps = {
  fullScreenPath: string;
  contactPath: string;
  locale?: string;
};

export function SpendingPageContent({
  fullScreenPath,
  contactPath,
  locale,
}: SpendingPageContentProps) {
  const { t, i18n } = useLingui();
  return (
    <Page>
      <PageContent>
        <Section>
          <H1>
            <Trans>Government Spending</Trans>
          </H1>
          <Intro>
            <Trans>
              Get data-driven insights into how governmental revenue and
              spending affect Canadian lives and programs.
            </Trans>
          </Intro>
        </Section>
        <Section>
          <H2>
            <Trans>FY 2024 Government Revenue and Spending</Trans>
          </H2>
          <P>
            <Trans>
              Explore revenue and spending categories or filter by agency for
              deeper insights.
            </Trans>
          </P>
        </Section>
      </PageContent>
      <div className="sankey-chart-container relative overflow-hidden sm:(mr-0 ml-0) md:(min-h-[776px] min-w-[1280px] w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2)">
        <NoSSR>
          <Sankey />
        </NoSSR>
        <div className="absolute bottom-3 left-6">
          <ExternalLink
            className="text-xs text-gray-400"
            href="https://www.canada.ca/en/public-services-procurement/services/payments-accounting/public-accounts/2024.html"
          >
            Source
          </ExternalLink>
        </div>
        <div className="absolute top-0 left-0 w-[100vw] h-full  backdrop-blur-sm z-10 text-white md:hidden flex items-center justify-center">
          <ExternalLink
            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            href={localizedPath(fullScreenPath, i18n.locale)}
          >
            <Trans>View this chart in full screen</Trans>
          </ExternalLink>
        </div>
      </div>
      <PageContent>
        <Section>
          <H2>
            <Trans>Government Workforce</Trans>
          </H2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatBox
              title={t`Headcount`}
              value="441,000"
              description={t`Total full-time equivalents`}
              growthPercentage={calculateGrowthPercentage("headcount")}
            />

            <StatBox
              title={t`Compensation per Employee`}
              value="$136,345"
              description={t`Average annual compensation`}
              growthPercentage={calculateGrowthPercentage("compensation")}
            />

            <StatBox
              title={t`Total Wages`}
              value="$65.3B"
              description={t`Annual payroll`}
              growthPercentage={calculateGrowthPercentage("wages")}
            />

            <div>
              <h3 className="font-medium mb-2">
                <Trans>Type of Tenure</Trans>
              </h3>
              <p className="text-sm text-gray-600">
                <Trans>80% of employees are in permanent roles</Trans>
              </p>
              <div className="mt-4">
                <NoSSR>
                  <TenureChart />
                </NoSSR>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">
                <Trans>Age</Trans>
              </h3>
              <p className="text-sm text-gray-600">
                <Trans>The average employee is 43.3 years old</Trans>
              </p>
              <div className="mt-4">
                <NoSSR>
                  <BarChart
                    className="h-40"
                    data={ageData}
                    index="name"
                    showLegend={false}
                    categories={["Count"]}
                    showGridLines={false}
                    valueFormatter={(value) =>
                      Intl.NumberFormat("en-US", {
                        notation: "compact",
                      }).format(Number(value))
                    }
                  />
                </NoSSR>
              </div>
            </div>

            <StatBox
              title={t`Departments + Agencies`}
              value="94"
              description={t`Federal organizations`}
            />
            <P className="text-sm">
              <Trans>Sources:</Trans>{" "}
              <ExternalLink href="https://www.pbo-dpb.ca/en/additional-analyses--analyses-complementaires/BLOG-2425-009--personnel-expenditure-analysis-tool-update-2023-24-personnel-expenditures--mise-jour-outil-analyse-depenses-personnel-depenses-personnel-2023-2024">
                <Trans>PBO</Trans>
              </ExternalLink>
              ,{" "}
              <ExternalLink href="https://www.canada.ca/en/treasury-board-secretariat/services/innovation/human-resources-statistics/demographic-snapshot-federal-public-service-2023.html">
                <Trans>Treasury Board</Trans>
              </ExternalLink>
            </P>

            <div className="md:col-span-3">
              <h3 className="font-medium mb-2">
                <Trans>Salary Distribution</Trans>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                <Trans>
                  Explore federal employee salary distribution by year and
                  demographic group
                </Trans>
              </p>
              <NoSSR>
                <SalaryDistributionChart />
              </NoSSR>
            </div>
            <P className="text-sm">
              <Trans>Source:</Trans>{" "}
              <ExternalLink href="https://www.canada.ca/en/treasury-board-secretariat/services/innovation/human-resources-statistics/diversity-inclusion-statistics/distribution-public-service-canada-employees-designated-group-salary-range.html">
                <Trans>Treasury Board</Trans>
              </ExternalLink>
            </P>
          </div>
        </Section>
        <Section>
          <H2>
            <Trans>Government Departments explained</Trans>
          </H2>
          <DepartmentList />
        </Section>
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

export default function Spending() {
  return (
    <SpendingPageContent
      fullScreenPath="/federal/spending-full-screen"
      contactPath="/contact"
    />
  );
}
