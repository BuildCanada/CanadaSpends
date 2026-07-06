import { ExternalLink } from "@/components/Layout";
import NoSSR from "@/components/NoSSR";
import { FederalSankey } from "@/components/Sankey/FederalSankey";
import {
  getFederalSankey,
  getFederalSummary,
  getFederalYears,
  isValidFederalYear,
} from "@/lib/federal";
import { initLingui } from "@/initLingui";
import { locales } from "@/lib/constants";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export async function generateStaticParams() {
  const years = getFederalYears();
  return locales.flatMap((lang) =>
    years.map((year) => ({ lang, year: String(year) })),
  );
}

export default async function FederalSpendingFullScreen({
  params,
}: {
  params: Promise<{ lang: string; year: string }>;
}) {
  const { lang, year } = await params;
  initLingui(lang);

  if (!isValidFederalYear(year)) {
    notFound();
  }

  const sankey = getFederalSankey(year, lang);
  const summary = getFederalSummary(year);
  if (!sankey || !summary) {
    notFound();
  }

  return (
    <div className="sankey-chart-container min-w-[1280px]">
      <NoSSR>
        <FederalSankey data={sankey} />
      </NoSSR>
      <div className="absolute bottom-3 left-6">
        <ExternalLink
          className="text-xs text-gray-400"
          href={summary.source_url}
        >
          Source
        </ExternalLink>
      </div>
    </div>
  );
}
