import { redirect, notFound } from "next/navigation";
import { Trans, useLingui } from "@lingui/react/macro";
import { initLingui } from "@/initLingui";
import { getFirstNationById, getAllFirstNations } from "@/lib/supabase";
import { locales, BASE_URL } from "@/lib/constants";
import {
  H1,
  Intro,
  Page,
  PageContent,
  Section,
  InternalLink,
} from "@/components/Layout";
import { generateHreflangAlternates } from "@/lib/utils";
import { Metadata } from "next";

export const revalidate = 3600;
export const dynamicParams = true;
// Render at request time to avoid build failure when api.buildcanada.com is unreachable
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const firstNations = await getAllFirstNations();

  return locales.flatMap((lang) =>
    firstNations.map((firstNation) => ({
      lang,
      bcid: firstNation.bcid,
    })),
  );
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

  const latestYear = firstNation.availableYears[0];

  // If First Nation has data, set canonical to latest year
  const canonical = latestYear
    ? `${BASE_URL}/${lang}/first-nations/${bcid}/${latestYear}`
    : `${BASE_URL}/${lang}/first-nations/${bcid}`;

  const provinceSuffix = firstNation.province
    ? `, ${firstNation.province}`
    : "";
  const title = `${firstNation.name}${provinceSuffix} | ${t`First Nations`} | Canada Spends`;
  const description = latestYear
    ? t`View financial data for ${firstNation.name}${provinceSuffix} from the First Nations Financial Transparency Act annual reports.`
    : t`${firstNation.name}${provinceSuffix} - No financial data is currently available under the First Nations Financial Transparency Act.`;

  return {
    title,
    description,
    alternates: {
      ...generateHreflangAlternates(lang, "/first-nations/[bcid]", { bcid }),
      canonical,
    },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function FirstNationOverviewPage({
  params,
}: {
  params: Promise<{ lang: string; bcid: string }>;
}) {
  const { lang, bcid } = await params;

  const firstNation = await getFirstNationById(bcid);

  if (!firstNation) {
    notFound();
  }

  const latestYear = firstNation.availableYears[0];

  // If First Nation has data, redirect to latest year
  if (latestYear) {
    redirect(`/${lang}/first-nations/${bcid}/${latestYear}`);
  }

  // Otherwise show a "no data" page
  initLingui(lang);

  return (
    <Page>
      <PageContent>
        <Section>
          <H1>{firstNation.name}</H1>
          <Intro>
            <Trans>
              {firstNation.name} is a First Nation
              {firstNation.province ? ` in ${firstNation.province}` : ""}.
            </Trans>
          </Intro>
        </Section>
        <Section>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">
              <Trans>
                No financial data is currently available for {firstNation.name}.
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
