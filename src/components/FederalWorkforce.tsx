"use client";

import { BarChart } from "@/components/BarChart";
import { ExternalLink, H2, P, Section } from "@/components/Layout";
import NoSSR from "@/components/NoSSR";
import { SalaryDistributionChart } from "@/components/SalaryDistributionChart";
import { TenureChart } from "@/components/TenureChart";
import { Trans, useLingui } from "@lingui/react/macro";

// ============================================================================
// FEDERAL WORKFORCE (headcount, wages, age, tenure, salary distribution)
//
// Explicitly OUT of the Public Accounts JSON pipeline (spec §1 non-goals): this
// data is sourced from TBS demographics and PBO personnel-expenditure analysis,
// not the public accounts. It stays hardcoded here and is rendered on the
// federal spending overview page only for the latest fiscal year.
// ============================================================================

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
    <div className="text-sm text-muted-foreground mb-1">{title}</div>
    <div className="text-3xl font-bold mb-1">{value}</div>
    <div className="text-sm text-muted-foreground">{description}</div>
    {growthPercentage && (
      <div
        className={`text-xs font-medium ${growthPercentage > 0 ? "text-chart-2" : "text-chart-11"}`}
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

export function FederalWorkforce() {
  const { t } = useLingui();
  return (
    <Section>
      <H2>
        <Trans>Government Workforce</Trans>
      </H2>
      <P className="text-sm text-muted-foreground">
        <Trans>
          Workforce figures are sourced from Treasury Board and PBO demographic
          data (latest available through 2023–24) and are independent of the
          Public Accounts fiscal year shown above.
        </Trans>
      </P>
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
          <p className="text-sm text-muted-foreground">
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
          <p className="text-sm text-muted-foreground">
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
          <p className="text-sm text-muted-foreground mb-4">
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
  );
}
