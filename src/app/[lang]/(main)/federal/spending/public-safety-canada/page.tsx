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
} from "@/components/Layout";
import NoSSR from "@/components/NoSSR";
import { StatCard, StatCardContainer } from "@/components/StatCard";
import { useFindDepartment } from "@/hooks/useDepartments";
import { initLingui, type PageLangParam } from "@/initLingui";
import { generateHreflangAlternates } from "@/lib/utils";
import { Trans, useLingui } from "@lingui/react/macro";
import type { PropsWithChildren } from "react";
import { FederalSpendingByEntity } from "./FederalSpendingByEntity";
import { MiniSankey } from "./MiniSankey";
import UpdatedAt from "../_common/updatedAt";

export async function generateMetadata(
  props: PropsWithChildren<PageLangParam>,
) {
  const lang = (await props.params).lang;
  initLingui(lang);

  const { t } = useLingui();
  return {
    title: t`Public Safety Canada | Canada Spends`,
    description: t`A look at how Public Safety Canada spends its budget`,
    alternates: generateHreflangAlternates(lang),
  };
}

export default async function Department(props: PageLangParam) {
  const lang = (await props.params).lang;
  initLingui(lang);

  const { t } = useLingui();
  const department = useFindDepartment("public-safety-canada");
  return (
    <Page>
      <PageContent>
        <Section>
          <H1>{department.name}</H1>
          <Intro>
            <Trans>
              Public Safety, Democratic Institutions and Intergovernmental
              Affairs Canada (Public Safety Canada) is the federal department
              responsible for national security, emergency preparedness, and
              community safety. Established in 2003, it consolidates security,
              law enforcement, and emergency management functions. It includes
              the RCMP, CSIS, and CBSA and coordinates federal responses to
              threats and develops policies on crime prevention, cyber
              resilience, and disaster preparedness while overseeing
              intelligence-sharing with domestic and international partners.
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
              value="$13.9B"
              subtitle={t`was spent by the Public Safety Canada`}
            />
            <StatCard
              title={t`In FY 2024,`}
              value="2.7%"
              subtitle={t`of federal spending was by the Public Safety Canada`}
            />
          </StatCardContainer>
        </Section>

        <Section>
          <P>
            <Trans>
              Public Safety Canada spent $13.9 billion in fiscal year (FY) 2024,
              accounting for 2.7% of the $513.9 billion in total federal
              spending. While not among the largest departments by expenditure,
              Public Safety Canada plays a crucial role in national security and
              emergency management, working in tandem with multiple agencies to
              mitigate threats and enhance public safety.
            </Trans>
          </P>

          <H3>
            <Trans>
              10 government departments accounted for 73.2% of federal spending
              in FY 2024.
            </Trans>
          </H3>

          <ChartContainer>
            <DepartmentSpendingChart department={department.slug} />
          </ChartContainer>
        </Section>

        <Section>
          <H2>
            <Trans>How has Public Safety Canada's spending changed?</Trans>
          </H2>
          <P>
            <Trans>
              Federal spending on public safety fluctuates based on evolving
              security threats, emergency events, and changes in government
              policy. Since 2005 shortly after it was established, Public Safety
              Canada's expenditures have increased by 69.6%, reflecting
              heightened investments in counterterrorism, cyber defence, and
              disaster response capabilities. The department's share of the
              federal budget has remained relatively flat from 2.6% in 2005 to
              2.7% in 2024.
            </Trans>
          </P>
          <P>
            <Trans>
              Major policy shifts, unforeseen events such as natural disasters,
              and global security concerns can significantly impact the
              department's annual spending. The COVID-19 pandemic, for example,
              led to a sharp increase in federal emergency response funding in
              2020.
            </Trans>
          </P>

          <ChartContainer>
            <FederalSpendingByEntity />
          </ChartContainer>
        </Section>

        <Section>
          <H2>
            <Trans>
              How did Public Safety Canada spend its budget in 2024?
            </Trans>
          </H2>
          <P>
            <Trans>
              In FY 2024, Public Safety's budget was allocated across several
              key areas, including:
            </Trans>
          </P>
          <ChartContainer>
            <NoSSR>
              <MiniSankey />
            </NoSSR>
          </ChartContainer>
        </Section>

        <Section>
          <H2>
            <Trans>Who leads Public Safety Canada?</Trans>
          </H2>
          <P>
            <Trans>
              The Department is led by the{" "}
              <ExternalLink href="https://www.canada.ca/en/government/ministers/david-mcguinty.html">
                Minister of Public Safety
              </ExternalLink>
              , who is appointed by the Governor General on the advice of the
              Prime Minister and then formally sworn into office at Rideau Hall.
              They take the Oath of Office and the Oath of Allegiance and become
              a member of the King's Privy Council for Canada.
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
