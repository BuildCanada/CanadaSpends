import { H2, H3, Intro, P, PageContent, Section } from "@/components/Layout";
import NoSSR from "@/components/NoSSR";
import { TwitterFeed } from "@/components/TwitterFeed";
import { initLingui, PageLangParam } from "@/initLingui";
import { Trans } from "@lingui/react/macro";
import Link from "next/link";
import { FiCornerLeftDown, FiCornerRightDown } from "react-icons/fi";
import { LuReceipt, LuUsersRound } from "react-icons/lu";
import { PiBank } from "react-icons/pi";

export default async function Page(props: PageLangParam) {
  const lang = (await props.params).lang;
  initLingui(lang);
  return (
    <>
      <section className="border-b-gray-200 border-b-2 flex-col justify-center relative flex overflow-hidden border-solid">
        <div className="px-4 py-0">
          <div className="items-center flex-col auto-cols-fr grid-cols-[.5fr_1.5fr_.5fr] grid-rows-[50px_auto_auto] justify-center justify-items-stretch text-center grid min-h-[88vh] py-0">
            <div
              className="items-center self-end flex-col col-end-3 col-start-2 justify-center flex max-w-[90.00rem]"
              style={{
                gridRow: "2",
              }}
            >
              <div className="relative my-4">
                <div className="text-fuchsia-600 bg-gray-200 bottom-0 left-0 absolute right-[51.88rem] top-[-216.75rem] z-[1] w-0 h-[200vw]" />
                <div className="text-gray-200 bg-gray-200 col-end-2 col-start-1 row-end-3 row-start-2 left-[-100vw] absolute z-[2] w-[300vw] h-0" />
                <div className="overflow-hidden text-[3.00rem] md:text-[5.00rem] leading-none font-medium">
                  <h1 className="pb-3 max-w-[18ch] m-0" id="h1-1">
                    <Trans>Get The Facts About Government Spending</Trans>
                  </h1>
                </div>
                <div className="text-gray-200 bg-gray-200 bottom-0 left-[-113.75rem] absolute right-0 top-[10.75rem] z-[2] w-[300vw] h-0" />
                <div className="bg-gray-200 self-start bottom-[-103.00rem] col-end-2 col-start-1 row-end-2 row-start-1 justify-self-start left-[51.88rem] absolute right-0 top-0 z-[1] w-0 h-[100vw]" />
              </div>
            </div>
            <div className="self-start col-end-3 col-start-2 row-end-4 row-start-3 relative overflow-hidden">
              <div className="items-center flex-col justify-center flex gap-8">
                <div className="flex-col flex max-w-[45.00rem] text-[1.63rem] leading-8 font-light">
                  <p className="opacity-75">
                    <Trans>
                      We share clear insights to level up transparency
                    </Trans>
                    <br />
                  </p>
                </div>
                <div className="flex gap-4">
                  {/* Federal */}
                  <Link
                    className="text-white bg-indigo-950 hover:bg-indigo-900 items-center font-medium justify-center py-2 px-4 relative flex w-auto min-w-[7.00rem] max-w-full overflow-hidden"
                    href="/spending"
                  >
                    <div className="items-center cursor-pointer justify-center relative flex overflow-hidden">
                      <div className="items-center justify-center flex p-1">
                        <Trans>Explore Federal Data</Trans>
                      </div>
                    </div>
                  </Link>

                  {/* Provincial (generic entry point for any province) */}
                  <Link
                    className="text-indigo-950 bg-white border-indigo-950 border-2 hover:bg-gray-100 items-center font-medium justify-center py-2 px-4 relative flex w-auto min-w-[7.00rem] max-w-full overflow-hidden"
                    href="/ontario"  // temporary until a /provincial hub exists
                  >
                    <div className="items-center cursor-pointer justify-center relative flex overflow-hidden">
                      <div className="items-center justify-center flex p-1">
                        <Trans>Explore Provincial Data</Trans>
                      </div>
                    </div>
                  </Link>

                  {/* Municipal (Toronto as the first/only option for now) */}
                  <Link
                    className="text-indigo-950 bg-white border-indigo-950 border-2 hover:bg-gray-100 items-center font-medium justify-center py-2 px-4 relative flex w-auto min-w-[7.00rem] max-w-full overflow-hidden"
                    href="/toronto"
                  >
                    <div className="items-center cursor-pointer justify-center relative flex overflow-hidden">
                      <div className="items-center justify-center flex p-1">
                        <Trans>Explore Municipal Data</Trans>
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
      <div className="border-b-gray-200 border-b-2 pb-20">
        <PageContent>
          <Section className="items-center flex-col justify-center flex ">
            <H2 className="text-5xl font-medium">
              <Trans>You deserve the facts</Trans>
            </H2>
            <Intro>
              <Trans id="facts-1">
                Government spending shouldn't be a black box. Every year, the
                federal government spends hundreds of billions of dollars but
                most Canadians have no clue where it all goes. The data is
                available, but it's buried on obscure websites and impossible to
                navigate.
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
      <div className="border-b-gray-200 border-b-2 pb-20">
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
                    We're strictly non-partisan—we don't judge policies or
                    debate spending decisions. Our only goal is to ensure that
                    every Canadian understands how the federal government spends
                    money.
                  </Trans>
                </P>
              </div>
            </div>
          </Section>
        </PageContent>
      </div>
      <PageContent>
        <Section className="bg-[#fafafa]">
          <NoSSR>
            <TwitterFeed />
          </NoSSR>
        </Section>
      </PageContent>
    </>
  );
}
