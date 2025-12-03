import { SpendingFullScreen } from "@/components/SpendingFullScreen";
import {
  getJurisdictionData,
  getMunicipalitiesByProvince,
  getAvailableYears,
} from "@/lib/jurisdictions";
import { locales } from "@/lib/constants";
import path from "path";

const dataDir = path.join(process.cwd(), "data");

export const dynamicParams = false;

export async function generateStaticParams() {
  const municipalitiesByProvince = getMunicipalitiesByProvince();

  const all = locales.flatMap((lang) =>
    municipalitiesByProvince.flatMap(({ province, municipalities }) =>
      municipalities.flatMap((municipality) => {
        const municipalPath = path.join(
          dataDir,
          "municipal",
          province,
          municipality.slug,
        );
        const years = getAvailableYears(municipalPath);
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

export default async function FullPageSpending({
  params,
}: {
  params: Promise<{
    province: string;
    municipality: string;
    year: string;
    lang: string;
  }>;
}) {
  const { province, municipality, year } = await params;
  const jurisdictionSlug = `${province}/${municipality}`;
  const { jurisdiction, sankey } = getJurisdictionData(jurisdictionSlug, year);

  return <SpendingFullScreen jurisdiction={jurisdiction} sankey={sankey} />;
}
