import { getMunicipalitiesByProvince } from "@/lib/jurisdictions";
import { locales } from "@/lib/constants";
import {
  getMunicipalityFinancialStatements,
  latestMunicipalFinancialYear,
} from "@/lib/municipal-financial-statements";
import { notFound, redirect } from "next/navigation";

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

export default async function MunicipalPage({
  params,
}: {
  params: Promise<{ province: string; municipality: string; lang: string }>;
}) {
  const { province, municipality, lang } = await params;
  const financialStatements = await getMunicipalityFinancialStatements(
    province,
    municipality,
  );
  const latestYear = latestMunicipalFinancialYear(financialStatements);
  if (!latestYear) notFound();

  // This target advances whenever a newer statement is reviewed. Keep the
  // redirect temporary so browsers and CDNs cannot pin the yearless URL.
  redirect(`/${lang}/municipal/${province}/${municipality}/${latestYear}`);
}
