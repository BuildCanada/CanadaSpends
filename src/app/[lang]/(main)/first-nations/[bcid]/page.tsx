import { redirect, notFound } from "next/navigation";
import { Trans } from "@lingui/react/macro";
import { initLingui } from "@/initLingui";
import { getBandById, getAllBands } from "@/lib/supabase";
import { locales } from "@/lib/constants";
import {
  H1,
  Intro,
  Page,
  PageContent,
  Section,
  InternalLink,
} from "@/components/Layout";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const bands = await getAllBands();

  return locales.flatMap((lang) =>
    bands.slice(0, 100).map((band) => ({
      lang,
      bcid: band.bcid,
    })),
  );
}

export default async function BandOverviewPage({
  params,
}: {
  params: Promise<{ lang: string; bcid: string }>;
}) {
  const { lang, bcid } = await params;

  const band = await getBandById(bcid);

  if (!band) {
    notFound();
  }

  const latestYear = band.availableYears[0];

  // If band has data, redirect to latest year
  if (latestYear) {
    redirect(`/${lang}/first-nations/${bcid}/${latestYear}`);
  }

  // Otherwise show a "no data" page
  initLingui(lang);

  return (
    <Page>
      <PageContent>
        <Section>
          <H1>{band.name}</H1>
          <Intro>
            <Trans>
              {band.name} is a First Nation
              {band.province ? ` in ${band.province}` : ""}.
            </Trans>
          </Intro>
        </Section>
        <Section>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">
              <Trans>
                No financial data is currently available for {band.name}.
              </Trans>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              <Trans>
                Financial data from annual reports published under the First
                Nations Financial Transparency Act will appear here once
                available.
              </Trans>
            </p>
            <InternalLink
              href="/first-nations"
              lang={lang}
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Trans>Browse all First Nations</Trans>
            </InternalLink>
          </div>
        </Section>
      </PageContent>
    </Page>
  );
}
