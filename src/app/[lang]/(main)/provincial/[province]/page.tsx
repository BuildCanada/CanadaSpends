import { ProvincialYearPageContent } from "@/app/[lang]/(main)/provincial/[province]/[year]/page";
import { BASE_URL } from "@/lib/constants";
import {
  getProvincialSlugs,
  getAvailableYearsForJurisdiction,
} from "@/lib/jurisdictions";
import { locales } from "@/lib/constants";
import { generateHreflangAlternates } from "@/lib/utils";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const dynamicParams = false;

export async function generateStaticParams() {
  const provinces = getProvincialSlugs();

  return locales.flatMap((lang) =>
    provinces.map((province) => ({
      lang,
      province,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ province: string; lang: string }>;
}): Promise<Metadata> {
  const { province, lang } = await params;
  const years = getAvailableYearsForJurisdiction(province);
  const latestYear = years.length > 0 ? years[0] : null;

  if (!latestYear) {
    return {};
  }

  // Set canonical URL to the latest year's URL to avoid duplicate content SEO issues
  const canonical = `${BASE_URL}/${lang}/provincial/${province}/${latestYear}`;

  return {
    alternates: {
      ...generateHreflangAlternates(lang, `/provincial/[province]`, {
        province,
      }),
      canonical,
    },
  };
}

export default async function ProvincialPage({
  params,
}: {
  params: Promise<{ province: string; lang: string }>;
}) {
  const { province, lang } = await params;

  // Get the latest year for this province
  const years = getAvailableYearsForJurisdiction(province);
  const latestYear = years.length > 0 ? years[0] : null;

  if (!latestYear) {
    notFound();
  }

  // Use the component from the year route
  return (
    <ProvincialYearPageContent
      province={province}
      year={latestYear}
      lang={lang}
    />
  );
}
