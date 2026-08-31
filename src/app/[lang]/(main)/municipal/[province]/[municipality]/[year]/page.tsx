import { MunicipalYearPageContent } from "@/components/municipal/MunicipalYearPageContent";
import {
  getMunicipalitiesByProvince,
  getAvailableYearsForJurisdiction,
} from "@/lib/jurisdictions";
import { locales } from "@/lib/constants";

export const dynamicParams = true;
export const dynamic = "force-dynamic";

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
