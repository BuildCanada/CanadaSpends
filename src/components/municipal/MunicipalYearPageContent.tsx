import { JurisdictionPageContent } from "@/components/JurisdictionPageContent";
import { MunicipalFinancialStatementContent } from "@/components/municipal/MunicipalFinancialStatementContent";
import { initLingui } from "@/initLingui";
import {
  getAvailableYearsForJurisdiction,
  getExpandedDepartments,
  getJurisdictionData,
} from "@/lib/jurisdictions";
import { getMunicipalityFinancialStatements } from "@/lib/municipal-financial-statements";
import { notFound } from "next/navigation";

type MunicipalYearPageContentProps = {
  province: string;
  municipality: string;
  year: string;
  lang: string;
};

export async function MunicipalYearPageContent({
  province,
  municipality,
  year,
  lang,
}: MunicipalYearPageContentProps) {
  initLingui(lang);

  const jurisdictionSlug = `${province}/${municipality}`;
  let financialStatements = null;
  try {
    financialStatements = await getMunicipalityFinancialStatements(
      province,
      municipality,
      year,
    );
  } catch {
    // Preserve the older curated municipality pages if York is unavailable.
  }
  const statement = financialStatements?.statements.find(
    (candidate) => candidate.fiscal_year === Number(year),
  );
  if (financialStatements && statement) {
    return (
      <MunicipalFinancialStatementContent
        municipality={financialStatements}
        statement={statement}
        lang={lang}
      />
    );
  }

  const hasCuratedData =
    getAvailableYearsForJurisdiction(jurisdictionSlug).includes(year);

  if (hasCuratedData) {
    const { jurisdiction, sankey } = getJurisdictionData(
      jurisdictionSlug,
      year,
    );
    const departments = getExpandedDepartments(jurisdictionSlug, year);

    return (
      <JurisdictionPageContent
        jurisdiction={jurisdiction}
        sankey={sankey}
        departments={departments}
        lang={lang}
        basePath={`/${lang}/municipal/${province}/${municipality}/${year}`}
        fullScreenPath={`/municipal/${province}/${municipality}/${year}/spending-full-screen`}
      />
    );
  }

  notFound();
}
