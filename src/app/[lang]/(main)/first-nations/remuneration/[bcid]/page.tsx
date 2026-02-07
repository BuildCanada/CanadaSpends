import { notFound } from "next/navigation";
import { Trans, useLingui } from "@lingui/react/macro";
import { initLingui } from "@/initLingui";
import {
  H1,
  Intro,
  Page,
  PageContent,
  Section,
  InternalLink,
} from "@/components/Layout";
import { RemunerationBreakdown } from "@/components/first-nations/RemunerationBreakdown";
import { getFirstNationById, getAllFirstNations } from "@/lib/supabase";
import {
  getRemunerationEntriesByBand,
  getBandRemunerationSummaryByBcid,
} from "@/lib/supabase/remuneration";
import { locales } from "@/lib/constants";
import { generateHreflangAlternates } from "@/lib/utils";
import { Metadata } from "next";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const firstNations = await getAllFirstNations();

    return locales.flatMap((lang) =>
      firstNations.map((firstNation) => ({
        lang,
        bcid: firstNation.bcid,
      })),
    );
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; bcid: string }>;
}): Promise<Metadata> {
  const { lang, bcid } = await params;

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

  const title = `${firstNation.name} Remuneration Breakdown${provinceSuffix} | Canada Spends`;
  const description = t`View all remuneration data for ${firstNation.name}${provinceSuffix} across all available years. Includes compensation and expenses for elected officials and staff from annual reports published under the FNFTA.`;

  return {
    title,
    description,
    alternates: generateHreflangAlternates(
      lang,
      "/first-nations/remuneration/[bcid]",
      { bcid },
    ),
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function FirstNationRemunerationPage({
  params,
}: {
  params: Promise<{ lang: string; bcid: string }>;
}) {
  const { lang, bcid } = await params;
  initLingui(lang);

  const [firstNation, summaries, entries] = await Promise.all([
    getFirstNationById(bcid),
    getBandRemunerationSummaryByBcid(bcid),
    getRemunerationEntriesByBand(bcid),
  ]);

  if (!firstNation) {
    notFound();
  }

  if (summaries.length === 0 && entries.length === 0) {
    notFound();
  }

  const provinceSuffix = firstNation.province
    ? `, ${firstNation.province}`
    : "";

  return (
    <Page>
      <PageContent>
        <Section>
          <div className="text-sm text-gray-500 mb-4">
            <InternalLink
              href="/first-nations"
              lang={lang}
              className="hover:text-auburn-900"
            >
              <Trans>First Nations</Trans>
            </InternalLink>
            {" / "}
            <InternalLink
              href={`/first-nations/${bcid}`}
              lang={lang}
              className="hover:text-auburn-900"
            >
              {firstNation.name}
            </InternalLink>
            {" / "}
            <span className="text-gray-700">
              <Trans>Remuneration</Trans>
            </span>
          </div>
          <H1>
            <Trans>
              {firstNation.name} Remuneration{provinceSuffix}
            </Trans>
          </H1>
          <Intro>
            <Trans>
              All remuneration entries for {firstNation.name} across{" "}
              {summaries.length} available fiscal year(s). Data is extracted
              from remuneration schedules published under the First Nations
              Financial Transparency Act (FNFTA).
            </Trans>
          </Intro>
        </Section>
        <Section>
          <RemunerationBreakdown summaries={summaries} entries={entries} />
        </Section>
      </PageContent>
    </Page>
  );
}
