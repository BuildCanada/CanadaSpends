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
    title: t`Indigenous Services and Northern Affairs Canada | Canada Spends`,
    description: t`A look at how Indigenous Services and Northern Affairs Canada spends its budget`,
    alternates: generateHreflangAlternates(lang),
  };
}

export default async function Department(props: PageLangParam) {
  const lang = (await props.params).lang;
  initLingui(lang);

  const { t } = useLingui();
  const department = useFindDepartment(
    "indigenous-services-and-northern-affairs",
  );
  return (
    <Page>
      <PageContent>
        <Section>
          <H1>{department.name}</H1>
          <Intro>
            <Trans>
              Indigenous Services Canada (ISC) and Crown-Indigenous Relations
              and Northern Affairs Canada (CIRNAC) are two distinct federal
              departments tasked with advancing Indigenous priorities in Canada.
              Established in 2017 following the dissolution of Indigenous and
              Northern Affairs Canada (INAC), these departments manage different
              aspects of Indigenous policy, service delivery, and governance.
            </Trans>
          </Intro>
          <Intro>
            <Trans>
              ISC is responsible for providing essential services to First
              Nations, Inuit, and Métis communities, including healthcare,
              education, housing, and child and family services. It also works
              to transfer control of these services to Indigenous-led
              organizations. CIRNAC focuses on treaty negotiations,
              self-government agreements, land claims, and Northern affairs,
              aiming to strengthen nation-to-nation relationships and modernize
              Indigenous governance structures. Together, ISC and CIRNAC oversee
              key programs that impact Indigenous communities across Canada.
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
              value="$63B"
              subtitle={t`was spent by ISC and CIRNAC`}
            />
            <StatCard
              title={t`In FY 2024,`}
              value="12.3%"
              subtitle={t`of federal spending was allocated to Indigenous priorities via these Departments. This does not include additional programs in other departments designed specifically for Indigenous beneficiaries.`}
            />
          </StatCardContainer>
        </Section>

        <Section>
          <P>
            <Trans>
              In fiscal year (FY) 2024, ISC and CIRNAC collectively spent{" "}
              <strong>$63 billion</strong>, accounting for{" "}
              <strong>12.3% of the total federal budget</strong>. The
              departments play a critical role in addressing socio-economic
              disparities, facilitating self-governance agreements, and
              improving service delivery for Indigenous communities across
              Canada.
            </Trans>
          </P>

          <ChartContainer>
            <DepartmentSpendingChart department={department.slug} />
          </ChartContainer>
          <P>
            <Trans>
              Federal spending on Indigenous priorities may fluctuate over time
              due to population growth, policy shifts, and emerging challenges
              such as climate change and infrastructure deficits. Since 1995,
              total federal spending has risen by 74.9%, while spending on
              Indigenous priorities has increased by 592%, reflecting expanded
              program commitments and new governance agreements and claim
              settlements.
            </Trans>
          </P>
          <P>
            <Trans>
              Despite these increases, significant challenges remain in areas
              such as housing, healthcare access, and infrastructure in remote
              Indigenous communities.
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>
              ISC + CIRNAC's share of federal spending in FY 2024 was 592%
              higher than in FY 1995
            </Trans>
          </H2>
          <H3>
            <Trans>
              Percentage of federal budget dedicated to Indigenous Priorities,
              FYs 1995-2024
            </Trans>
          </H3>
          <ChartContainer>
            <FederalSpendingChart />
          </ChartContainer>
        </Section>

        <Section>
          <P>
            <Trans>
              Most federal spending can be categorized as direct or indirect.
              Direct spending refers to money the federal government spends on
              budget items such as federal programs, employee salaries, and debt
              interest. Indirect spending refers to federal transfers to other
              levels of government.
            </Trans>
          </P>
          <P>
            <Trans>
              In FY 2024, ISC and CIRNAC transferred 93.1% of total spending
              directly to indigenous communities.
            </Trans>
          </P>
        </Section>
        <Section>
          <H2>
            <Trans>How did ISC and CIRNAC spend their budgets in 2024?</Trans>
          </H2>
          <H3>
            <Trans>Federal government spending in FY 2024</Trans>
          </H3>
          <ChartContainer>
            <NoSSR>
              <MiniSankey />
            </NoSSR>
          </ChartContainer>
          <ChartContainer>
            <H3>
              <Trans>ISC + CIRNAC, Spending by Entity, FY 2024</Trans>
            </H3>
            <FederalSpendingByEntity />
          </ChartContainer>
        </Section>

        <Section>
          <H2>
            <Trans>Who leads ISC and CIRNAC?</Trans>
          </H2>
          <P>
            <Trans>
              The leadership of ISC and CIRNAC are led by the{" "}
              <ExternalLink href="https://www.canada.ca/en/government/ministers/patty-hajdu.html">
                Minister of Indigenous Services Canada
              </ExternalLink>{" "}
              and the{" "}
              <ExternalLink href="https://www.pm.gc.ca/en/cabinet/honourable-gary-anandasangaree">
                Minister of Crown-Indigenous Relations and Northern Affairs
                Canada
              </ExternalLink>
              , respectively. These Ministers are appointed by the Governor
              General on the advice of the Prime Minister and then formally
              sworn into office at Rideau Hall. They take the Oath of Office and
              the Oath of Allegiance and become a member of the King's Privy
              Council for Canada.
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
