import { ExternalLink, H2, P, Section } from "@/components/Layout";
import { InflationValue } from "@/components/InflationContext";
import { StatCard, StatCardContainer } from "@/components/StatCard";
import { WorkforceHeadcountChart } from "@/components/WorkforceHeadcountChart";
import { FederalWorkforce, FederalWorkforcePoint } from "@/lib/federal";
import { Trans } from "@lingui/react/macro";

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
// ============================================================================

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

      <P className="text-sm mt-4">
        <Trans>Source:</Trans>{" "}
        <ExternalLink href={workforce.source_url}>
          <Trans>Treasury Board of Canada Secretariat</Trans>
        </ExternalLink>
      </P>
    </Section>
  );
}
