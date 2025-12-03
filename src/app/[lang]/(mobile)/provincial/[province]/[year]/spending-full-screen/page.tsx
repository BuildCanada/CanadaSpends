import { SpendingFullScreen } from "@/components/SpendingFullScreen";
import {
  getJurisdictionData,
  getProvincialSlugs,
  getAvailableYears,
} from "@/lib/jurisdictions";
import { locales } from "@/lib/constants";
import path from "path";

const dataDir = path.join(process.cwd(), "data");

export const dynamicParams = false;

export async function generateStaticParams() {
  const provinces = getProvincialSlugs();

  const all = locales.flatMap((lang) =>
    provinces.flatMap((province) => {
      const provincialPath = path.join(dataDir, "provincial", province);
      const years = getAvailableYears(provincialPath);
      return years.map((year) => ({
        lang,
        province,
        year,
      }));
    }),
  );

  return all;
}

export default async function FullPageSpending({
  params,
}: {
  params: Promise<{ province: string; year: string; lang: string }>;
}) {
  const { province, year } = await params;
  const { jurisdiction, sankey } = getJurisdictionData(province, year);

  return <SpendingFullScreen jurisdiction={jurisdiction} sankey={sankey} />;
}
