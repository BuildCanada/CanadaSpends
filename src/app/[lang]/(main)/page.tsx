import { H2, H3, Intro, P, PageContent, Section } from "@/components/Layout";
import NoSSR from "@/components/NoSSR";
import { TwitterFeed } from "@/components/TwitterFeed";
import { initLingui, PageLangParam } from "@/initLingui";
import { Trans } from "@lingui/react/macro";
import Link from "next/link";
import { FiCornerLeftDown, FiCornerRightDown } from "react-icons/fi";
import { LuReceipt, LuUsersRound } from "react-icons/lu";
import { PiBank } from "react-icons/pi";
import { IS_BUDGET_2025_LIVE } from "@/lib/featureFlags";
import { generateHreflangAlternates, localizedPath } from "@/lib/utils";
import { Metadata } from "next";

export async function generateMetadata(
  props: PageLangParam,
): Promise<Metadata> {
  const lang = (await props.params).lang;
  return {
    alternates: generateHreflangAlternates(lang),
  };
}

export default async function Page(props: PageLangParam) {
  const lang = (await props.params).lang;
  initLingui(lang);
  return (
    <>
      <section className="border-b-muted border-b-2 flex-col justify-center relative flex overflow-hidden border-solid">
        <div className="px-4 py-0">
          <div className="items-center flex-col auto-cols-fr grid-cols-[.5fr_1.5fr_.5fr] grid-rows-[50px_auto_auto] justify-center justify-items-stretch text-center grid min-h-[88vh] py-0">
            <div
              className="items-center self-end flex-col col-end-3 col-start-2 justify-center flex max-w-[90.00rem]"
              style={{
                gridRow: "2",
              }}
            >
              <div className="relative my-4">
                <div className="text-aurora-600 bg-muted bottom-0 left-0 absolute right-[51.88rem] top-[-216.75rem] z-[1] w-0 h-[200vw]" />
                <div className="text-muted bg-muted col-end-2 col-start-1 row-end-3 row-start-2 left-[-100vw] absolute z-[2] w-[300vw] h-0" />
                <div className="overflow-hidden text-[3.00rem] md:text-[5.00rem] leading-none font-medium">
                  <h1 className="pb-3 max-w-[18ch] m-0" id="h1-1">
                    <Trans>Get The Facts About Government Spending</Trans>
                  </h1>
                </div>
                <div className="text-muted bg-muted bottom-0 left-[-113.75rem] absolute right-0 top-[10.75rem] z-[2] w-[300vw] h-0" />
                <div className="bg-muted self-start bottom-[-103.00rem] col-end-2 col-start-1 row-end-2 row-start-1 justify-self-start left-[51.88rem] absolute right-0 top-0 z-[1] w-0 h-[100vw]" />
              </div>
            </div>
            <div className="self-start col-end-3 col-start-2 row-end-4 row-start-3 relative overflow-hidden">
              <div className="items-center flex-col justify-center flex gap-8">
                <div className="flex-col flex max-w-180 text-[1.63rem] leading-8 font-light">
                  <p className="opacity-75">
                    <Trans>
                      We share clear insights to level up transparency
                    </Trans>
                    <br />
                  </p>
                </div>
                <div className="flex gap-4">
                  <Link
                    className="text-card bg-lake-700 hover:bg-lake-800 items-center font-medium justify-center py-2 px-4 relative flex w-auto min-w-28 max-w-full overflow-hidden"
                    href={localizedPath(
                      IS_BUDGET_2025_LIVE ? "/budget" : "/spending",
                      lang,
                    )}
                  >
                    <div className="items-center cursor-pointer justify-center relative flex overflow-hidden">
                      <div className="items-center justify-center flex p-1">
                        {IS_BUDGET_2025_LIVE ? (
                          <Trans>Explore Budget 2025</Trans>
                        ) : (
                          <Trans>Explore federal data</Trans>
                        )}
                      </div>
                    </div>
                  </Link>
                  <Link
                    className=" bg-accent text-accent-foreground border-border border-2 hover:bg-muted items-center font-medium justify-center py-2 px-4 relative flex w-auto min-w-28 max-w-full overflow-hidden"
                    href={localizedPath("/ontario", lang)}
                  >
                    <div className="items-center cursor-pointer justify-center relative flex overflow-hidden">
                      <div className="items-center justify-center flex p-1">
                        <Trans>Explore Ontario data</Trans>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
            <div className="items-center bottom-0 justify-center left-0 opacity-75 pb-3 absolute right-0 flex gap-[0.38rem] m-auto">
              <div className="pt-1 flex">
                <FiCornerLeftDown className="align-middle inline-block w-3 h-3 max-w-full" />
              </div>
              <Trans>Start reading</Trans>
              <div className="pt-1 flex">
                <FiCornerRightDown className="align-middle inline-block w-3 h-3 max-w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="border-b-muted border-b-2 pb-20">
        <PageContent>
          <Section className="items-center flex-col justify-center flex ">
            <H2 className="text-5xl font-medium">
              <Trans>You deserve the facts</Trans>
            </H2>
            <Intro>
              <Trans id="facts-1">
                Government spending shouldn&apos;t be a black box. Every year,
                the federal government spends hundreds of billions of dollars
                but most Canadians have no clue where it all goes. The data is
                available, but it&apos;s buried on obscure websites and
                impossible to navigate.
              </Trans>
            </Intro>
            <Intro>
              <Trans id="facts-2">
                Canada Spends changes this. We take raw federal spending data
                and turn it into accurate, straightforward facts so you can
                understand how your money is used.
              </Trans>
            </Intro>
          </Section>
        </PageContent>
      </div>
      <div className="border-b-muted border-b-2 pb-20">
        <PageContent>
          <Section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col gap-2 items-center text-center">
                <div className="text-4xl mb-4">
                  <PiBank />
                </div>
                <H3>
                  <Trans>Facts about Spending</Trans>
                </H3>
                <P>
                  <Trans>
                    We turn complex government data into clear insights. We
                    explain federal spending so every Canadian can understand
                    where their money goes.
                  </Trans>
                </P>
              </div>
              <div className="flex flex-col gap-2 items-center text-center">
                <div className="text-4xl mb-4">
                  <LuReceipt />
                </div>
                <H3>
                  <Trans>Based on Data</Trans>
                </H3>
                <P>
                  <Trans>
                    All the information comes from public databases and reports
                    by the Government of Canada. We show our sources, so you
                    know exactly where it comes from.
                  </Trans>
                </P>
              </div>
              <div className="flex flex-col gap-2 items-center text-center">
                <div className="text-4xl mb-4">
                  <LuUsersRound />
                </div>
                <H3>
                  <Trans>Non-Partisan</Trans>
                </H3>
                <P>
                  <Trans>
                    We&apos;re strictly non-partisan—we don&apos;t judge
                    policies or debate spending decisions. Our only goal is to
                    ensure that every Canadian understands how the federal
                    government spends money.
                  </Trans>
                </P>
              </div>
            </div>
          </Section>
        </PageContent>
      </div>
      <PageContent>
        <Section className="bg-card">
          <NoSSR>
            <TwitterFeed />
          </NoSSR>
        </Section>
      </PageContent>
    </>
  );
}
