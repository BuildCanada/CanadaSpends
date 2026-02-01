import { notFound } from "next/navigation";
import { Trans } from "@lingui/react/macro";
import { DetailsPage } from "./DetailsPage";
import { ContractsOver10k } from "./Contracts";
import { generateMetadata } from "./metadata";

interface Props {
  id: string;
  database: string;
}

// Re-define BASE constant for other fetchers
const BASE = "https://api.canadasbuilding.com/canada-spends";

function jsonFetcher(url: string) {
  return fetch(url, { cache: "no-store" }).then((res) =>
    res.ok ? res.json() : null,
  );
}

// Re-export generateMetadata from metadata.ts
export { generateMetadata };

// ... KeyValueTable, NSERCGrants, CIHRGrants, etc. ...

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; database: string; lang: string }>;
}) {
  const { id, database } = await params;

  const componentMap: Record<string, React.ComponentType<Props>> = {
    "contracts-over-10k": ContractsOver10k,
    cihr_grants: CIHRGrants,
    nserc_grants: NSERCGrants,
    sshrc_grants: SSHRCGrants,
    global_affairs_grants: GlobalAffairsGrants,
    transfers: Transfers,
  };

  const Component = componentMap[database];
  if (!Component) {
    console.warn(
      `No component found for database type: ${database}. Displaying 404.`,
    );
    return notFound(); // Display 404 if no component matches (handles aggregated type)
  }

  return <Component id={id} database={database} />;
}

async function NSERCGrants({ id, database }: Props & { database: string }) {
  const url = `${BASE}/nserc_grants/${id}.json?_shape=array`;
  const data = await jsonFetcher(url);
  if (!data || data.length === 0) return notFound();
  const grant = data[0];

  return (
    <DetailsPage
      fiscal_year={grant.fiscal_year}
      title={grant.title}
      source_url={grant.source_url}
      recipient={grant.institution}
      award_amount={grant.award_amount}
      program={grant.program}
      type="NSERC Research Grants"
      summary={grant.award_summary}
      database={database}
    >
      <Detail label={<Trans>Awarded</Trans>} value={grant.competition_year} />
      <Detail label={<Trans>Installment</Trans>} value={grant.installment} />
      <Detail
        label={<Trans>Principal Investigator</Trans>}
        value={grant.project_lead_name}
      />
      <Detail label={<Trans>Institution</Trans>} value={grant.institution} />
      <Detail label={<Trans>Department</Trans>} value={grant.department} />
      <Detail label={<Trans>Province</Trans>} value={grant.province} />
      <Detail
        label={<Trans>Competition Year</Trans>}
        value={grant.competition_year}
      />
      <Detail label={<Trans>Fiscal Year</Trans>} value={grant.fiscal_year} />
      <Detail
        label={<Trans>Selection Committee</Trans>}
        value={grant.selection_committee}
      />
      <Detail
        label={<Trans>Research Subject</Trans>}
        value={grant.research_subject}
      />
      <Detail
        label={<Trans>Application ID</Trans>}
        value={grant.application_id}
      />
    </DetailsPage>
  );
}

async function CIHRGrants({ id, database }: Props & { database: string }) {
  const url = `${BASE}/cihr_grants/${id}.json?_shape=array`;
  const data = await jsonFetcher(url);
  if (!data || data.length === 0) return notFound();
  const grant = data[0];

  return (
    <DetailsPage
      fiscal_year={grant.competition_year.slice(0, 4)}
      title={grant.title}
      source_url={grant.source_url}
      recipient={grant.institution}
      award_amount={grant.award_amount}
      program={grant.program}
      type="CIHR Research Grant"
      summary={grant.abstract?.replaceAll("\n", "\n\n")}
      keywords={grant.keywords.split(";")}
      database={database}
    >
      <Detail
        label={<Trans>Principal Investigator</Trans>}
        value={grant.project_lead_name}
      />
      <Detail label={<Trans>Institution</Trans>} value={grant.institution} />
      <Detail label={<Trans>Province</Trans>} value={grant.province} />
      <Detail label={<Trans>Duration</Trans>} value={grant.duration} />
      <Detail
        label={<Trans>Competition Year</Trans>}
        value={grant.competition_year}
      />
      <Detail label={<Trans>Program Type</Trans>} value={grant.program_type} />
      <Detail label={<Trans>Theme</Trans>} value={grant.theme} />
      <Detail
        label={<Trans>Research Subject</Trans>}
        value={grant.research_subject}
      />
      <Detail label={<Trans>External ID</Trans>} value={grant.external_id} />
    </DetailsPage>
  );
}

async function SSHRCGrants({ id, database }: Props & { database: string }) {
  const url = `${BASE}/sshrc_grants/${id}.json?_shape=array`;
  const data = await jsonFetcher(url);
  if (!data || data.length === 0) return notFound();
  const grant = data[0];

  return (
    <DetailsPage
      fiscal_year={grant.fiscal_year}
      title={grant.title}
      source_url={grant.source_url}
      recipient={grant.applicant}
      award_amount={grant.amount}
      program={grant.program}
      type="SSHRC Research Grant"
      summary=""
      keywords={grant.keywords
        .replaceAll('["', "")
        .replaceAll('"]', "")
        .split("\\n")}
      database={database}
    >
      <Detail
        label={<Trans>Principal Applicant</Trans>}
        value={grant.applicant}
      />
      <Detail label={<Trans>Organization</Trans>} value={grant.organization} />
      <Detail
        label={<Trans>Co-Applicant(s)</Trans>}
        value={grant.co_applicant}
      />
      <Detail
        label={<Trans>Competition Year</Trans>}
        value={grant.competition_year}
      />
      <Detail label={<Trans>Fiscal Year</Trans>} value={grant.fiscal_year} />
      <Detail label={<Trans>Discipline</Trans>} value={grant.discipline} />
      <Detail
        label={<Trans>Area of Research</Trans>}
        value={grant.area_of_research}
      />
    </DetailsPage>
  );
}

async function GlobalAffairsGrants({
  id,
  database,
}: Props & { database: string }) {
  const url = `${BASE}/global_affairs_grants/${id}.json?_shape=array`;
  const data = await jsonFetcher(url);
  if (!data || data.length === 0) return notFound();
  const grant = data[0];

  // Parse DAC sectors if they're in JSON string format
  let dacSectors: string[] = [];
  try {
    if (grant.DACSectors) {
      const parsed = JSON.parse(grant.DACSectors);
      dacSectors = Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    dacSectors = grant.DACSectors ? [grant.DACSectors] : [];
  }

  // Parse policy markers if they're in JSON string format
  let policyMarkers: string[] = [];
  try {
    if (grant.policyMarkers) {
      const parsed = JSON.parse(grant.policyMarkers);
      policyMarkers = Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    policyMarkers = grant.policyMarkers ? [grant.policyMarkers] : [];
  }

  // Combine all keywords for display
  const keywords = [...dacSectors, ...policyMarkers];

  return (
    <DetailsPage
      fiscal_year={new Date(grant.start).getFullYear().toString()}
      title={grant.title}
      source_url={grant.source_url || ""}
      recipient={grant.executingAgencyPartner || ""}
      award_amount={parseFloat(grant.maximumContribution)}
      program={grant.programName || ""}
      type="Global Affairs Grant"
      summary={grant.description}
      keywords={keywords}
      database={database}
    >
      <Detail
        label={<Trans>Project Number</Trans>}
        value={grant.projectNumber}
      />
      <Detail label={<Trans>Status</Trans>} value={grant.status} />
      <Detail
        label={<Trans>Start Date</Trans>}
        value={new Date(grant.start).toLocaleDateString()}
      />
      <Detail
        label={<Trans>End Date</Trans>}
        value={new Date(grant.end).toLocaleDateString()}
      />
      <Detail label={<Trans>Countries</Trans>} value={grant.countries} />
      <Detail
        label={<Trans>Executing Agency/Partner</Trans>}
        value={grant.executingAgencyPartner}
      />
      <Detail
        label={<Trans>Maximum Contribution</Trans>}
        value={`$${parseFloat(grant.maximumContribution).toLocaleString()}`}
      />
      <Detail
        label={<Trans>Contributing Organization</Trans>}
        value={grant.ContributingOrganization}
      />
      <Detail
        className="col-span-full"
        label={<Trans>Expected Results</Trans>}
        value={grant.expectedResults}
      />
      <Detail
        className="col-span-full"
        label={<Trans>Results Achieved</Trans>}
        value={grant.resultsAchieved}
      />
      <Detail label={<Trans>Aid Type</Trans>} value={grant.aidType} />
      <Detail
        label={<Trans>Collaboration Type</Trans>}
        value={grant.collaborationType}
      />
      <Detail label={<Trans>Finance Type</Trans>} value={grant.financeType} />
      <Detail
        label={<Trans>Reporting Organization</Trans>}
        value={grant.reportingOrganisation}
      />
      <Detail label={<Trans>Program Name</Trans>} value={grant.programName} />
      <Detail
        label={<Trans>Selection Mechanism</Trans>}
        value={grant.selectionMechanism}
      />
      <Detail
        label={<Trans>Regions</Trans>}
        value={grant.regions?.replace(/[\[\]"]/g, "")}
      />
    </DetailsPage>
  );
}

async function Transfers({ id, database }: Props & { database: string }) {
  const url = `${BASE}/transfers/${id}.json?_shape=array`;
  const data = await jsonFetcher(url);
  if (!data || data.length === 0) return notFound();
  const transfer = data[0];

  const fiscalYear = transfer.FSCL_YR || "—";
  const ministry = transfer.MINE || transfer.MINC || transfer.MINF || "—";
  const recipient = transfer.RCPNT_NML_EN_DESC || "—";
  const amount = transfer.AGRG_PYMT_AMT || 0;
  const location =
    [transfer.CTY_EN_NM, transfer.PROVTER_EN, transfer.CNTRY_EN_NM]
      .filter(Boolean)
      .join(", ") || "—";

  // Define the constant URL for the dataset page
  const datasetPageUrl =
    "https://open.canada.ca/data/en/dataset/69bdc3eb-e919-4854-bc52-a435a3e19092";

  return (
    <>
      <DetailsPage
        fiscal_year={fiscalYear}
        title={transfer.RCPNT_CLS_EN_DESC || "—"}
        source_url={datasetPageUrl}
        recipient={recipient}
        award_amount={amount}
        program={transfer.DEPT_EN_DESC || "—"}
        type="Federal Transfer"
        summary=""
        database={database}
      >
        <Detail
          label={<Trans>Department</Trans>}
          value={transfer.DEPT_EN_DESC}
        />
        <Detail label={<Trans>Ministry</Trans>} value={ministry} />
        <Detail label={<Trans>Fiscal Year</Trans>} value={fiscalYear} />
        <Detail
          label={<Trans>Recipient Class</Trans>}
          value={transfer.RCPNT_CLS_EN_DESC}
        />
        <Detail label={<Trans>Recipient</Trans>} value={recipient} />
        <Detail label={<Trans>Location</Trans>} value={location} />
        <Detail
          label={<Trans>Payment Amount</Trans>}
          value={`$${Number(amount).toLocaleString()}`}
        />
      </DetailsPage>
    </>
  );
}

function Detail({
  label,
  value,
  className,
}: {
  label: React.ReactNode;
  value: unknown;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="font-bold text-foreground">{label}</div>
      <div className="text-foreground-muted">{String(value || "—")}</div>
    </div>
  );
}
