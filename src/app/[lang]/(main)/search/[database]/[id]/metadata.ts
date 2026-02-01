import { Metadata } from "next";
import { generateHreflangAlternates } from "@/lib/utils";

const BASE = "https://api.canadasbuilding.com/canada-spends";

function jsonFetcher(url: string) {
  return fetch(url, { cache: "no-store" }).then((res) =>
    res.ok ? res.json() : null,
  );
}

// Helper function to format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Helper function to optimize title length (keep under 70 chars)
function optimizeTitle(
  baseTitle: string,
  suffix: string = " | Canada Spends",
): string {
  let title = baseTitle + suffix;

  if (title.length > 70) {
    // Try removing optional parts from baseTitle (like periods in parentheses)
    // This is handled by the caller, so if still too long, truncate
    const maxBaseLength = 70 - suffix.length;
    if (maxBaseLength > 0) {
      return baseTitle.substring(0, maxBaseLength - 3) + "..." + suffix;
    }
    // If suffix itself is too long, just return truncated baseTitle
    return baseTitle.substring(0, 67) + "...";
  }

  return title;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; database: string; lang: string }>;
}): Promise<Metadata> {
  const { id, database, lang } = await params;

  // Fetch data based on database type
  const url = `${BASE}/${database}/${id}.json?_shape=array`;
  const data = await jsonFetcher(url);

  if (!data || data.length === 0) {
    return {
      title: "Record Not Found | Canada Spends",
      alternates: generateHreflangAlternates(lang, "/search/[database]/[id]", {
        database,
        id,
      }),
    };
  }

  const record = data[0];
  let title = "";
  let description = "";
  let ogTitle = "";

  // Generate metadata based on database type
  switch (database) {
    case "contracts-over-10k": {
      const vendorName = record.vendor_name || "Unknown Vendor";
      const contractValue = record.contract_value || 0;
      const reportingPeriod = record.reporting_period || "";
      const contractDescription =
        record.description_en || "Government Contract";
      const comments =
        record.comments_en || record.additional_comments_en || "";

      const formattedValue = formatCurrency(contractValue);
      // Build title with optional period, optimizeTitle will truncate if needed
      let baseTitle = `${vendorName} - ${formattedValue} Contract`;
      if (reportingPeriod) {
        baseTitle += ` (${reportingPeriod})`;
      }
      title = optimizeTitle(baseTitle);

      description = `${vendorName} - ${formattedValue} government contract`;
      if (
        contractDescription &&
        contractDescription !== "Government Contract"
      ) {
        description += ` for ${contractDescription}`;
      }
      if (reportingPeriod) {
        description += ` (${reportingPeriod})`;
      }
      if (comments && description.length < 100) {
        const availableSpace = 155 - description.length - 3;
        const truncatedComments =
          comments.length > availableSpace
            ? comments.substring(0, availableSpace).trim() + "..."
            : comments;
        description += `. ${truncatedComments}`;
      }

      ogTitle = `${vendorName} - ${formattedValue} Government Contract`;
      break;
    }

    case "nserc_grants": {
      const institution = record.institution || "Unknown Institution";
      const amount = record.award_amount || 0;
      const projectTitle = record.title || "Research Grant";
      const fiscalYear = record.fiscal_year || "";
      const investigator = record.project_lead_name || "";

      const formattedAmount = formatCurrency(amount);
      const baseTitle = `${institution} - ${formattedAmount} NSERC Grant${fiscalYear ? ` (${fiscalYear})` : ""}`;
      title = optimizeTitle(baseTitle);

      description = `${institution} - ${formattedAmount} NSERC research grant`;
      if (investigator) {
        description += ` awarded to ${investigator}`;
      }
      if (fiscalYear) {
        description += ` (${fiscalYear})`;
      }
      if (projectTitle && description.length < 100) {
        const availableSpace = 155 - description.length - 3;
        const truncatedTitle =
          projectTitle.length > availableSpace
            ? projectTitle.substring(0, availableSpace).trim() + "..."
            : projectTitle;
        description += `. ${truncatedTitle}`;
      }

      ogTitle = `${institution} - ${formattedAmount} NSERC Research Grant`;
      break;
    }

    case "cihr_grants": {
      const institution = record.institution || "Unknown Institution";
      const amount = record.award_amount || 0;
      const projectTitle = record.title || "Research Grant";
      const competitionYear = record.competition_year || "";
      const investigator = record.project_lead_name || "";

      const formattedAmount = formatCurrency(amount);
      const baseTitle = `${institution} - ${formattedAmount} CIHR Grant${competitionYear ? ` (${competitionYear})` : ""}`;
      title = optimizeTitle(baseTitle);

      description = `${institution} - ${formattedAmount} CIHR research grant`;
      if (investigator) {
        description += ` awarded to ${investigator}`;
      }
      if (competitionYear) {
        description += ` (${competitionYear})`;
      }
      if (projectTitle && description.length < 100) {
        const availableSpace = 155 - description.length - 3;
        const truncatedTitle =
          projectTitle.length > availableSpace
            ? projectTitle.substring(0, availableSpace).trim() + "..."
            : projectTitle;
        description += `. ${truncatedTitle}`;
      }

      ogTitle = `${institution} - ${formattedAmount} CIHR Research Grant`;
      break;
    }

    case "sshrc_grants": {
      const applicant =
        record.applicant || record.organization || "Unknown Applicant";
      const amount = record.amount || 0;
      const projectTitle = record.title || "Research Grant";
      const fiscalYear = record.fiscal_year || "";
      const organization = record.organization || "";

      const formattedAmount = formatCurrency(amount);
      const baseTitle = `${applicant} - ${formattedAmount} SSHRC Grant${fiscalYear ? ` (${fiscalYear})` : ""}`;
      title = optimizeTitle(baseTitle);

      description = `${applicant} - ${formattedAmount} SSHRC research grant`;
      if (organization && organization !== applicant) {
        description += ` at ${organization}`;
      }
      if (fiscalYear) {
        description += ` (${fiscalYear})`;
      }
      if (projectTitle && description.length < 100) {
        const availableSpace = 155 - description.length - 3;
        const truncatedTitle =
          projectTitle.length > availableSpace
            ? projectTitle.substring(0, availableSpace).trim() + "..."
            : projectTitle;
        description += `. ${truncatedTitle}`;
      }

      ogTitle = `${applicant} - ${formattedAmount} SSHRC Research Grant`;
      break;
    }

    case "global_affairs_grants": {
      const recipient = record.executingAgencyPartner || "Unknown Partner";
      const amount = parseFloat(record.maximumContribution) || 0;
      const projectTitle = record.title || "International Grant";
      const programName = record.programName || "";
      const year = record.start
        ? new Date(record.start).getFullYear().toString()
        : "";

      const formattedAmount = formatCurrency(amount);
      const baseTitle = `${recipient} - ${formattedAmount} Global Affairs Grant${year ? ` (${year})` : ""}`;
      title = optimizeTitle(baseTitle);

      description = `${recipient} - ${formattedAmount} Global Affairs Canada grant`;
      if (programName) {
        description += ` under ${programName}`;
      }
      if (year) {
        description += ` (${year})`;
      }
      if (projectTitle && description.length < 100) {
        const availableSpace = 155 - description.length - 3;
        const truncatedTitle =
          projectTitle.length > availableSpace
            ? projectTitle.substring(0, availableSpace).trim() + "..."
            : projectTitle;
        description += `. ${truncatedTitle}`;
      }

      ogTitle = `${recipient} - ${formattedAmount} Global Affairs Grant`;
      break;
    }

    case "transfers": {
      const recipient = record.RCPNT_NML_EN_DESC || "Unknown Recipient";
      const amount = record.AGRG_PYMT_AMT || 0;
      const recipientClass = record.RCPNT_CLS_EN_DESC || "Transfer Payment";
      const fiscalYear = record.FSCL_YR || "";
      const department = record.DEPT_EN_DESC || "";

      const formattedAmount = formatCurrency(amount);
      const baseTitle = `${recipient} - ${formattedAmount} Federal Transfer${fiscalYear ? ` (${fiscalYear})` : ""}`;
      title = optimizeTitle(baseTitle);

      description = `${recipient} - ${formattedAmount} federal transfer payment`;
      if (recipientClass && recipientClass !== "Transfer Payment") {
        description += ` (${recipientClass})`;
      }
      if (department) {
        description += ` from ${department}`;
      }
      if (fiscalYear) {
        description += ` (${fiscalYear})`;
      }

      ogTitle = `${recipient} - ${formattedAmount} Federal Transfer`;
      break;
    }

    default:
      return {
        title: "Spending Details | Canada Spends",
        description:
          "View detailed information about government spending on Canada Spends.",
        alternates: generateHreflangAlternates(
          lang,
          "/search/[database]/[id]",
          {
            database,
            id,
          },
        ),
      };
  }

  return {
    title,
    description,
    alternates: generateHreflangAlternates(lang, "/search/[database]/[id]", {
      database,
      id,
    }),
    openGraph: {
      title: ogTitle,
      description,
      type: "website",
    },
  };
}
