import { JurisdictionPageContent } from "@/components/JurisdictionPageContent";
import { initLingui } from "@/initLingui";
import {
  getExpandedDepartments,
  getJurisdictionData,
  getProvincialSlugs,
  getAvailableYearsForJurisdiction,
} from "@/lib/jurisdictions";
import { locales } from "@/lib/constants";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export async function generateStaticParams() {
  const provinces = getProvincialSlugs();

  const all = locales.flatMap((lang) =>
    provinces.flatMap((province) => {
      const years = getAvailableYearsForJurisdiction(province);
      return years.map((year) => ({
        lang,
        province,
        year,
      }));
    }),
  );

  return all;
}

type ProvincialYearPageContentProps = {
  province: string;
  year: string;
  lang: string;
};

export async function ProvincialYearPageContent({
  province,
  year,
  lang,
}: ProvincialYearPageContentProps) {
  initLingui(lang);

  try {
    const { jurisdiction, sankey } = getJurisdictionData(province, year);
    const departments = getExpandedDepartments(province, year);

    return (
      <JurisdictionPageContent
        jurisdiction={jurisdiction}
        sankey={sankey}
        departments={departments}
        lang={lang}
        basePath={`/${lang}/provincial/${province}/${year}`}
        fullScreenPath={`/provincial/${province}/${year}/spending-full-screen`}
      />
    );
  } catch {
    notFound();
  }
}

export default async function ProvincialYearPage({
  params,
}: {
  params: Promise<{ province: string; year: string; lang: string }>;
}) {
  const { province, year, lang } = await params;
  return (
    <ProvincialYearPageContent province={province} year={year} lang={lang} />
  );
}
