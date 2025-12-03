import { JurisdictionPageContent } from "@/components/JurisdictionPageContent";
import { initLingui } from "@/initLingui";
import {
  getExpandedDepartments,
  getJurisdictionData,
  getMunicipalitiesByProvince,
  getAvailableYearsForJurisdiction,
} from "@/lib/jurisdictions";
import { locales } from "@/lib/constants";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export async function generateStaticParams() {
  const municipalitiesByProvince = getMunicipalitiesByProvince();

  const all = locales.flatMap((lang) =>
    municipalitiesByProvince.flatMap(({ province, municipalities }) =>
      municipalities.flatMap((municipality) => {
        const jurisdictionSlug = `${province}/${municipality.slug}`;
        const years = getAvailableYearsForJurisdiction(jurisdictionSlug);
        return years.map((year) => ({
          lang,
          province,
          municipality: municipality.slug,
          year,
        }));
      }),
    ),
  );

  return all;
}

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

  try {
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
  } catch {
    notFound();
  }
}

export default async function MunicipalYearPage({
  params,
}: {
  params: Promise<{
    province: string;
    municipality: string;
    year: string;
    lang: string;
  }>;
}) {
  const { province, municipality, year, lang } = await params;
  return (
    <MunicipalYearPageContent
      province={province}
      municipality={municipality}
      year={year}
      lang={lang}
    />
  );
}
