import { DepartmentList } from "@/components/DepartmentList";
import { DepartmentSpendingChart } from "@/components/DepartmentSpendingChart";
import {
  ChartContainer,
  ExternalLink,
  H1,
  H2,
  H3,
  Intro,
  P,
  Page,
  PageContent,
  Section,
  UL,
} from "@/components/Layout";
import NoSSR from "@/components/NoSSR";
import { StatCard, StatCardContainer } from "@/components/StatCard";
import { useFindDepartment } from "@/hooks/useDepartments";
import { initLingui, type PageLangParam } from "@/initLingui";
import { generateHreflangAlternates } from "@/lib/utils";
import { Trans, useLingui } from "@lingui/react/macro";
import type { PropsWithChildren } from "react";
import { FederalSpendingByEntity } from "./FederalSpendingByEntity";
import { FederalSpendingChart } from "./FederalSpendingChart";
import { MiniSankey } from "./MiniSankey";
import UpdatedAt from "../_common/updatedAt";

export async function generateMetadata(
  props: PropsWithChildren<PageLangParam>,
) {
  const lang = (await props.params).lang;
  initLingui(lang);

  const { t } = useLingui();
  return {
    title: t`Global Affairs Canada | Canada Spends`,
    description: t`A look at how the Global Affairs Canada spends its budget`,
    alternates: generateHreflangAlternates(lang),
  };
}

export default async function Department(props: PageLangParam) {
  const lang = (await props.params).lang;
  initLingui(lang);

  const { t } = useLingui();
  const department = useFindDepartment("global-affairs-canada");

  return (
    <Page>
      <PageContent>
        <Section>
          <H1>{department?.name}</H1>
          <Intro>
            <Trans>
              Global Affairs Canada (GAC) is the federal department responsible
              for managing Canada's diplomatic relations, international trade,
              and development assistance. Established in 1909 as the Department
              of External Affairs, GAC has evolved to oversee Canada's
              engagement in global affairs, promoting national interests abroad
              and ensuring the protection of Canadian citizens overseas. The
              department negotiates international agreements, administers trade
              policies, and provides humanitarian aid. Additionally, it supports
              Canadian businesses in expanding internationally and strengthens
              diplomatic ties through multilateral organizations like the United
              Nations, the World Trade Organization (WTO), and NATO. GAC also
              plays a critical role in crisis response, assisting Canadians
              abroad during emergencies, and fostering global security and
              stability.
            </Trans>
          </Intro>
        </Section>

        <Section>
          <UpdatedAt>
            <Trans>Data updated March 21, 2025</Trans>
          </UpdatedAt>
          <StatCardContainer>
            <StatCard
              title={t`In FY 2024,`}
              value="$19.2B"
              subtitle={t`was spent by the Global Affairs Canada`}
            />
            <StatCard
              title={t`In FY 2024,`}
              value="3.7%"
              subtitle={t`of federal spending was by the Global Affairs Canada`}
            />
          </StatCardContainer>
        </Section>

        <Section>
          <P>
            <Trans>
              Global Affairs Canada spent $19.2 billion in fiscal year (FY)
              2024, representing 3.7% of the $513.9 billion in overall federal
              spending. This placed GAC among the mid-sized federal departments
              in terms of total expenditures.
            </Trans>
          </P>

          <H2>
            <Trans>
              GAC accounted for 3.7% of all federal spending in FY 2024.
            </Trans>
          </H2>

          <H3>
            <Trans>
              10 government departments accounted for 73.2% of federal spending
              in FY 2024.
            </Trans>
          </H3>

          <ChartContainer>
            <DepartmentSpendingChart department={department.slug} />
          </ChartContainer>

          <P>
            <Trans>
              Federal spending may shift over time due to changing global
              circumstances, diplomatic priorities, and Canada's economic
              relationships. Since 1995, overall federal spending has increased
              by 74.9%, while Global Affairs Canada's budget has grown by
              166.5%, reflecting an expansion in international engagement.
            </Trans>
          </P>

          <ChartContainer>
            <H3>
              <Trans>
                Percentage of federal budget dedicated to Global Affairs Canada,
                FYs 1995-2024
              </Trans>
            </H3>
            <FederalSpendingChart />
          </ChartContainer>

          <P>
            <Trans>
              While GAC's spending has increased in real terms, its share of the
              federal budget has also increased moderately over the past
              decades. In 2024, GAC accounted for 3.7% of federal spending,
              compared to 2% in 1995.
            </Trans>
          </P>
          <P>
            <Trans>
              Major international events, trade agreements, foreign aid
              commitments, and global crises such as the COVID-19 pandemic have
              influenced fluctuations in spending. In 2020, GAC's budget surged
              due to emergency international assistance programs, including
              vaccine distribution and humanitarian relief efforts.
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>
              How did Global Affairs Canada spend its budget in 2024?
            </Trans>
          </H2>
          <P>
            <Trans>
              GAC's expenditures are divided across five primary categories:
            </Trans>
          </P>
          <UL>
            <li>
              <Trans>International Advocacy and Diplomacy: $1B</Trans>
            </li>
            <li>
              <Trans>Trade and Investment: $380.3M</Trans>
            </li>
            <li>
              <Trans>Development, Peace and Security Programming: $5.37B</Trans>
            </li>
            <li>
              <Trans>Help for Canadians Abroad: $85.98M</Trans>
            </li>
            <li>
              <Trans>Support for Canada's Presence Abroad: $1.23B</Trans>
            </li>
          </UL>
          <P>
            <Trans>
              A significant portion of GAC's budget supports Canada's
              international development assistance, with key programs focused on
              climate adaptation, gender equality, and health initiatives in
              developing nations. The department also facilitates economic
              diplomacy and trade agreements that benefit Canadian businesses
              and secure investment opportunities abroad.
            </Trans>
          </P>
          <H3>
            <Trans>Federal government spending in FY 2024</Trans>
          </H3>
          <ChartContainer>
            <NoSSR>
              <MiniSankey />
            </NoSSR>
          </ChartContainer>
        </Section>

        <Section>
          <P>
            <Trans>
              Federal departments often contain other entities. In FY 2024,
              Global Affairs Canada's entities with the highest expenditures
              were:
            </Trans>
          </P>
          <ChartContainer>
            <H3>
              <Trans>Global Affairs Canada, Spending by Entity, FY 2024</Trans>
            </H3>
            <FederalSpendingByEntity />
          </ChartContainer>
        </Section>

        <Section>
          <H2>
            <Trans>Who leads Global Affairs Canada?</Trans>
          </H2>
          <P>
            <Trans>
              Global Affairs Canada is led by two ministers appointed by the
              Prime Minister and formally sworn into office at Rideau Hall. The
              department's leadership includes:
            </Trans>
          </P>
          <UL>
            <li>
              <Trans>
                <ExternalLink href="https://www.pm.gc.ca/en/cabinet/honourable-melanie-joly">
                  Minister of Foreign Affairs
                </ExternalLink>
                : Responsible for diplomacy, international security,
                international development assistance, and global partnerships.
              </Trans>
            </li>
            <li>
              <Trans>
                <ExternalLink href="https://www.pm.gc.ca/en/cabinet/honourable-dominic-leblanc">
                  Minister of International Trade
                </ExternalLink>
                : Oversees Canada's trade negotiations, export promotion, and
                economic policy engagement.
              </Trans>
            </li>
          </UL>
          <P>
            <Trans>
              The ministers work alongside the Deputy Minister of Foreign
              Affairs and the Deputy Minister of International Trade, who manage
              the department's operational and policy frameworks.
            </Trans>
          </P>
          <P>
            <Trans>
              These Ministers are some of the{" "}
              <ExternalLink href="https://www.pm.gc.ca/en/cabinet">
                cabinet members
              </ExternalLink>{" "}
              who serve at the Prime Minister's discretion. Their tenure
              typically ends when they resign, are replaced, or when a new Prime
              Minister takes office and appoints a new cabinet. Outgoing
              ministers remain in their roles until their successors are sworn
              in.
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>Explore other Federal Departments</Trans>
          </H2>
          <DepartmentList current={department.slug} />
        </Section>
      </PageContent>
    </Page>
  );
}
