import {
  ExternalLink,
  H1,
  Intro,
  Page,
  PageContent,
  Section,
} from "@/components/Layout";
import { initLingui, PageLangParam } from "@/initLingui";
import { generateHreflangAlternates } from "@/lib/utils";
import { Trans, useLingui } from "@lingui/react/macro";
import { PropsWithChildren } from "react";

export async function generateMetadata(
  props: PropsWithChildren<PageLangParam>,
) {
  const lang = (await props.params).lang;
  initLingui(lang);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useLingui();
  return {
    title: t`Connect with us`,
    description: t`Have questions or feedback? Email us at hi@canadaspends.com or connect with us on X @canada_spends - we'd love to hear from you!`,
    alternates: generateHreflangAlternates(lang),
  };
}

export default async function Contact(props: PropsWithChildren<PageLangParam>) {
  const lang = (await props.params).lang;
  initLingui(lang);

  return (
    <Page>
      <PageContent>
        <Section>
          <H1>
            <Trans>Connect with us</Trans>
          </H1>
          <Intro>
            <Trans>We love to hear from the community.</Trans>
          </Intro>
          <Intro>
            <Trans>
              Email us at{" "}
              <ExternalLink href="mailto:hi@buildcanada.com">
                hi@buildcanada.com
              </ExternalLink>{" "}
              or connect with us on X{" "}
              <ExternalLink href="https://x.com/canada_spends">
                @canada_spends
              </ExternalLink>{" "}
              and we&apos;ll get back to you as soon as we can.
            </Trans>
          </Intro>
        </Section>
      </PageContent>
    </Page>
  );
}
