import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/Accordion";
import { ExternalLink, P } from "@/components/Layout";
import { Trans, useLingui } from "@lingui/react/macro";

export default function FAQ() {
  const { t } = useLingui();

  const faqs = [
    {
      question: t`What is your methodology?`,
      answer: t`Canada Spends primarily relies on Public Accounts data from the Office of the Receiver General within Public Services and Procurement Canada. Data for the previous fiscal year is typically released in December of that year, though the release month can vary. For example, complete FY 2024 data covering the period April 1, 2023 - March 31, 2024 was released in December 2024. Public Accounts documents provide the final, consolidated view of total federal government spending for each fiscal year.`,
    },
    {
      question: t`What data sources were used?`,
      answer: (
        <span>
          <Trans>
            All data presented regarding government spending is sourced directly
            from official government databases. Unless otherwise noted, we have
            used{" "}
            <ExternalLink href="https://www.canada.ca/en/public-services-procurement/services/payments-accounting/public-accounts.html">
              Public Accounts of Canada
            </ExternalLink>{" "}
            data as the primary data source. While we strive to provide
            accurate, up-to-date information, we cannot guarantee the
            data&apos;s completeness, reliability, or timeliness. We assume no
            responsibility for any errors, omissions, or outcomes resulting from
            the use of this information. Please consult the original government
            sources for official and verified data.
          </Trans>
        </span>
      ),
    },
    {
      question: t`Why did you start this project?`,
      answer: t`We were frustrated by the lack of clear, accessible, unbiased data on government spending. We wanted to create a platform that focused on giving Canadians data-driven facts about how their money is being spent without spin.`,
    },
    {
      question: t`What are the core ideas?`,
      answer: t`We believe that Canadians need access to easy to understand information about government spending. We don't pass judgement on public spending decisions. We don't tell you what to think. Our only agenda is to ensure that all Canadians get the facts on spending in a clear and simple format.`,
    },
    {
      question: t`Where do you get the data on your website?`,
      answer: t`All of the information we use comes from publicly available databases and reports issued by the Government of Canada. We reference sources for all of our content.`,
    },
    {
      question: t`Is this a lobby group?`,
      answer: t`No, we are not a lobby group. We are not paid, nor do we represent any special interest groups. Our mission is purely to share data-driven insights on federal government spending.`,
    },
    {
      question: t`What is your affiliation with Build Canada?`,
      answer: t`We are a project of Build Canada. While some team members overlap, involvement in Build Canada doesn't imply involvement in Canada Spends and vice versa.`,
    },
    {
      question: t`How can I show my support?`,
      answer: t`The best way to support us is to engage with our content. Like, share, and comment on our posts on social media. Even better, share our work with a friend and encourage them to do the same. Together, we can expand the conversation and reach more people with these important facts.`,
    },
    {
      question: t`Can I donate?`,
      answer: (
        <P>
          <Trans>
            Canada Spends, as a project of Build Canada, is funded through
            donations from our builder network. Donate
          </Trans>{" "}
          <ExternalLink href="https://buy.stripe.com/3cI5kCdi8a2K2xY2bgdZ600https://buy.stripe.com/3cI5kCdi8a2K2xY2bgdZ600">
            here
          </ExternalLink>{" "}
          <Trans>to help us support our mission.</Trans>
        </P>
      ),
    },
    {
      question: t`How can I stay up to date on your work?`,
      answer: (
        <P>
          <Trans>Stay connected by following us on</Trans>{" "}
          <ExternalLink href="https://www.x.com/canada_spends">X</ExternalLink>{" "}
          <Trans>or subscribe to</Trans>{" "}
          <ExternalLink href="https://buildcanada.substack.com/subscribe">
            Build Canada&apos;s newsletter
          </ExternalLink>
          .
        </P>
      ),
    },
    {
      question: t`Can I get involved?`,
      answer: (
        <P>
          <Trans>
            We welcome passionate individuals who want to help make a
            difference. Whether it&apos;s by contributing your skills, helping
            with outreach, or amplifying our work, we&apos;d love to hear from
            you
          </Trans>{" "}
          <ExternalLink href="https://buildcanada.com/get-involved">
            here
          </ExternalLink>
          .
        </P>
      ),
    },
    {
      question: t`Are you DOGE?`,
      answer: (
        <>
          <P>
            <Trans>
              No, we&apos;re not copying the DOGE playbook from the US.
            </Trans>
          </P>
          <P>
            <Trans>
              We care about Canada winning. We care about Canada being a
              self-sustaining, independent and resilient country.
            </Trans>
          </P>
          <P>
            <Trans>
              Our government is going to have to make hard choices about our
              nation&apos;s spending to ensure we can invest in creating a
              competitive, resilient, and independent nation. We care about
              giving Canadians the facts about spending so they can engage in
              this conversation with elected officials.
            </Trans>
          </P>
        </>
      ),
    },
  ];

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full bg-card/50 px-8 py-6"
    >
      {faqs.map((faq) => (
        <AccordionItem
          key={faq.question}
          value={faq.question}
          className="bg-card text-card-foreground px-4 py-2 my-2"
        >
          <AccordionTrigger>
            <strong>{faq.question}</strong>
          </AccordionTrigger>
          <AccordionContent className="">{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
