import { getMunicipalitiesByProvince } from "@/lib/jurisdictions";
import { getAvailableYearsForJurisdiction } from "@/lib/jurisdictions";
import { BASE_URL, locales } from "@/lib/constants";
import {
  getMunicipalityFinancialStatements,
  latestMunicipalFinancialYear,
} from "@/lib/municipal-financial-statements";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { generateHreflangAlternates } from "@/lib/utils";

export const dynamicParams = true;
export const dynamic = "force-dynamic";

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

async function latestYearFor(province: string, municipality: string) {
  try {
    const statements = await getMunicipalityFinancialStatements(
      province,
      municipality,
    );
    return latestMunicipalFinancialYear(statements);
  } catch {
    const years = getAvailableYearsForJurisdiction(
      `${province}/${municipality}`,
    );
    return years.length ? Math.max(...years.map(Number)) : null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ province: string; municipality: string; lang: string }>;
}): Promise<Metadata> {
  const { province, municipality, lang } = await params;
  const latestYear = await latestYearFor(province, municipality);
  if (!latestYear) return {};

  const canonical = `${BASE_URL}/${lang}/municipal/${province}/${municipality}/${latestYear}`;
  return {
    alternates: {
      ...generateHreflangAlternates(
        lang,
        "/municipal/[province]/[municipality]",
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
  const latestYear = await latestYearFor(province, municipality);
  if (!latestYear) notFound();

  // This target advances whenever a newer statement is reviewed. Keep the
  // redirect temporary so browsers and CDNs cannot pin the yearless URL.
  redirect(`/${lang}/municipal/${province}/${municipality}/${latestYear}`);
}
