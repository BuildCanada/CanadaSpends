import { notFound } from "next/navigation";
import { useLingui } from "@lingui/react/macro";
import { initLingui } from "@/initLingui";
import { FirstNationsPageContent } from "@/components/first-nations";
import {
  getAllFirstNations,
  getClaimsByFirstNation,
  getFirstNationById,
  getFirstNationYearData,
} from "@/lib/supabase";
import { locales } from "@/lib/constants";
import { generateHreflangAlternates } from "@/lib/utils";
import { Metadata } from "next";

export const revalidate = 3600;
export const dynamicParams = true;
// Render at request time to avoid build failure when api.buildcanada.com is unreachable
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const firstNations = await getAllFirstNations();

  // Pre-generate pages for all First Nations with all their available years
  return locales.flatMap((lang) =>
    firstNations.flatMap((firstNation) =>
      firstNation.availableYears.map((year) => ({
        lang,
        bcid: firstNation.bcid,
        year,
      })),
    ),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; bcid: string; year: string }>;
}): Promise<Metadata> {
  const { lang, bcid, year } = await params;

  const firstNation = await getFirstNationById(bcid);

  if (!firstNation) {
    return {};
  }

  initLingui(lang);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useLingui();

  const provinceSuffix = firstNation.province
    ? `, ${firstNation.province}`
    : "";

  // Create a descriptive title with the First Nation name, year, and location
  const title = `${firstNation.name} ${year} Financial Data${provinceSuffix} | Canada Spends`;

  // Create a rich description mentioning what data is available
  const description = t`View ${year} financial statements for ${firstNation.name}${provinceSuffix}. Includes statement of operations, financial position, and remuneration data from the First Nations Financial Transparency Act annual report.`;

  return {
    title,
    description,
    alternates: generateHreflangAlternates(
      lang,
      "/first-nations/[bcid]/[year]",
      {
        bcid,
        year,
      },
    ),
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function FirstNationYearPage({
  params,
}: {
  params: Promise<{ lang: string; bcid: string; year: string }>;
}) {
  const { lang, bcid, year } = await params;
  initLingui(lang);

  const firstNation = await getFirstNationById(bcid);

  if (!firstNation) {
    notFound();
  }

  // Check if the requested year is valid for this First Nation
  if (!firstNation.availableYears.includes(year)) {
    notFound();
  }

  const [firstNationYearData, claims] = await Promise.all([
    getFirstNationYearData(bcid, year),
    getClaimsByFirstNation(bcid),
  ]);

  const {
    statementOfOperations,
    statementOfFinancialPosition,
    remuneration,
    notes,
  } = firstNationYearData;

  // If no data at all, show not found
  if (
    !statementOfOperations &&
    !statementOfFinancialPosition &&
    !remuneration &&
    !notes
  ) {
    notFound();
  }

  return (
    <FirstNationsPageContent
      firstNation={firstNation}
      year={year}
      statementOfOperations={statementOfOperations}
      statementOfFinancialPosition={statementOfFinancialPosition}
      remuneration={remuneration}
      notes={notes}
      claims={claims}
      lang={lang}
    />
  );
}
