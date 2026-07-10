import { ExternalLink, H2, P, Section } from "@/components/Layout";
import { InflationValue } from "@/components/InflationContext";
import NoSSR from "@/components/NoSSR";
import { StatCard, StatCardContainer } from "@/components/StatCard";
import { WorkforceBandChart } from "@/components/WorkforceBandChart";
import { WorkforceHeadcountChart } from "@/components/WorkforceHeadcountChart";
import {
  FederalWorkforce,
  FederalWorkforceBand,
  FederalWorkforcePoint,
} from "@/lib/federal";
import { Trans, useLingui } from "@lingui/react/macro";

// ============================================================================
// FEDERAL WORKFORCE STRIP (per selected year)
//
// Headcount + personnel-spending figures for the year currently shown on the
// overview page. Headcount comes from the TBS "Population of the Federal Public
// Service" series (as of March 31); personnel spending is the government-wide
// standard-object Personnel figure from the Public Accounts. Rendered only when
// that year's data/federal/{year}/workforce.json exists. Personnel spending
// participates in the inflation toggle (billions); headcount and the per-head
// cost are plain figures.
//
// Demographics (age bands, tenure, salary distribution) are per-year TBS data
// carried in the same workforce.json; each chart renders only when that
// dimension exists for the year (the salary series starts in 2017 and covers
// the employment-equity population — captioned accordingly).
// ============================================================================

function bandChartData(bands: FederalWorkforceBand[], lang: string) {
  return bands.map((b) => ({
    name: lang === "fr" ? b.label_fr : b.label_en,
    value: b.count,
  }));
}

export function FederalWorkforceStrip({
  workforce,
  series,
  financialYear,
  lang,
}: {
  workforce: FederalWorkforce;
  series: FederalWorkforcePoint[];
  financialYear: string;
  lang: string;
}) {
  const { t } = useLingui();
  const locale = lang === "fr" ? "fr-CA" : "en-CA";
  const headcountLabel = new Intl.NumberFormat(locale).format(
    workforce.headcount,
  );
  const avgCostLabel = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(workforce.averagePersonnelCost);

  const chartData = series.map((p) => ({
    Year: String(p.year),
    Headcount: p.headcount,
  }));

  return (
    <Section>
      <H2>
        <Trans>Federal workforce</Trans>
      </H2>
      <P className="text-sm text-muted-foreground">
        <Trans>
          Federal public service headcount (as of March 31) and personnel
          spending — salaries and benefits — for the selected fiscal year.
          Headcount is from Treasury Board; personnel spending is from the
          Public Accounts standard objects.
        </Trans>
      </P>
      <StatCardContainer>
        <StatCard
          title={<Trans>Employees in FY {financialYear}</Trans>}
          value={headcountLabel}
          subtitle={
            <Trans>federal public service headcount (as of March 31)</Trans>
          }
        />
        <StatCard
          title={<Trans>Personnel spending in FY {financialYear}</Trans>}
          value={<InflationValue nominal={workforce.personnelSpending} />}
          subtitle={<Trans>salaries and benefits (standard object)</Trans>}
        />
        <StatCard
          title={<Trans>Average personnel cost</Trans>}
          value={avgCostLabel}
          subtitle={<Trans>per employee (salaries and benefits)</Trans>}
        />
      </StatCardContainer>

      <div className="mt-8">
        <h3 className="font-medium mb-2">
          <Trans>Headcount over time</Trans>
        </h3>
        <WorkforceHeadcountChart data={chartData} />
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {workforce.ageBands && (
          <div>
            <h3 className="font-medium mb-2">
              <Trans>Age</Trans>
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              <Trans>Employees by age band (as of March 31)</Trans>
            </p>
            <NoSSR>
              <WorkforceBandChart
                data={bandChartData(workforce.ageBands, lang)}
                seriesLabel={t`Employees`}
              />
            </NoSSR>
          </div>
        )}

        {workforce.tenure && (
          <div>
            <h3 className="font-medium mb-2">
              <Trans>Type of Tenure</Trans>
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              <Trans>Employees by type of tenure (as of March 31)</Trans>
            </p>
            <NoSSR>
              <WorkforceBandChart
                data={bandChartData(workforce.tenure, lang)}
                seriesLabel={t`Employees`}
              />
            </NoSSR>
          </div>
        )}

        {workforce.salaryBands && (
          <div className="md:col-span-2">
            <h3 className="font-medium mb-2">
              <Trans>Salary Distribution</Trans>
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              <Trans>
                Employees by salary range (as of March 31). This series covers
                the employment-equity population, a subset of the federal public
                service.
              </Trans>
            </p>
            <NoSSR>
              <WorkforceBandChart
                data={bandChartData(workforce.salaryBands, lang)}
                seriesLabel={t`Employees`}
              />
            </NoSSR>
          </div>
        )}
      </div>

      <P className="text-sm mt-4">
        <Trans>Source:</Trans>{" "}
        <ExternalLink href={workforce.source_url}>
          <Trans>Treasury Board of Canada Secretariat</Trans>
        </ExternalLink>
      </P>
    </Section>
  );
}
