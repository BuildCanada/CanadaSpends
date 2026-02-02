import { notFound } from "next/navigation";
import { initLingui } from "@/initLingui";
import { BandPageContent } from "@/components/first-nations";
import { getBandById, getBandYearData, getAllBands } from "@/lib/supabase";
import { locales } from "@/lib/constants";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const bands = await getAllBands();

  // Pre-generate pages for top bands with their available years
  const params = locales.flatMap((lang) =>
    bands.slice(0, 50).flatMap((band) =>
      band.availableYears.map((year) => ({
        lang,
        bcid: band.bcid,
        year,
      })),
    ),
  );

  // Limit total static params to avoid build timeout
  return params.slice(0, 200);
}

export default async function BandYearPage({
  params,
}: {
  params: Promise<{ lang: string; bcid: string; year: string }>;
}) {
  const { lang, bcid, year } = await params;
  initLingui(lang);

  const band = await getBandById(bcid);

  if (!band) {
    notFound();
  }

  // Check if the requested year is valid for this band
  if (!band.availableYears.includes(year)) {
    notFound();
  }

  const {
    statementOfOperations,
    statementOfFinancialPosition,
    remuneration,
    notes,
  } = await getBandYearData(bcid, year);

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
    <BandPageContent
      band={band}
      year={year}
      statementOfOperations={statementOfOperations}
      statementOfFinancialPosition={statementOfFinancialPosition}
      remuneration={remuneration}
      notes={notes}
      lang={lang}
    />
  );
}
