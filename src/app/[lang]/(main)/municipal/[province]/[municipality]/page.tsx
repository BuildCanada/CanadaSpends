import { MunicipalYearPageContent } from "@/app/[lang]/(main)/municipal/[province]/[municipality]/[year]/page";
import { BASE_URL } from "@/lib/constants";
import {
  getMunicipalitiesByProvince,
  getAvailableYearsForJurisdiction,
} from "@/lib/jurisdictions";
import { locales } from "@/lib/constants";
import { generateHreflangAlternates } from "@/lib/utils";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const dynamicParams = false;

export async function generateStaticParams() {
  const municipalitiesByProvince = getMunicipalitiesByProvince();

  return locales.flatMap((lang) =>
    municipalitiesByProvince.flatMap(({ province, municipalities }) =>
      municipalities.map((municipality) => ({
        lang,
        province,
        municipality: municipality.slug,
      })),
    ),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ province: string; municipality: string; lang: string }>;
}): Promise<Metadata> {
  const { province, municipality, lang } = await params;
  const jurisdictionSlug = `${province}/${municipality}`;
  const years = getAvailableYearsForJurisdiction(jurisdictionSlug);
  const latestYear = years.length > 0 ? years[0] : null;

  if (!latestYear) {
    return {};
  }

  // Set canonical URL to the latest year's URL to avoid duplicate content SEO issues
  const canonical = `${BASE_URL}/${lang}/municipal/${province}/${municipality}/${latestYear}`;
  return {
    alternates: {
      ...generateHreflangAlternates(
        lang,
        `/municipal/[province]/[municipality]`,
        { province, municipality },
      ),
      canonical,
    },
  };
}

export default async function MunicipalPage({
  params,
}: {
  params: Promise<{ province: string; municipality: string; lang: string }>;
}) {
  const { province, municipality, lang } = await params;

  const jurisdictionSlug = `${province}/${municipality}`;

  // Get the latest year for this municipality
  const years = getAvailableYearsForJurisdiction(jurisdictionSlug);
  const latestYear = years.length > 0 ? years[0] : null;

  if (!latestYear) {
    notFound();
  }

  // Use the component from the year route
  return (
    <MunicipalYearPageContent
      province={province}
      municipality={municipality}
      year={latestYear}
      lang={lang}
    />
  );
}
