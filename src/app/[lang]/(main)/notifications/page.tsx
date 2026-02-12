import { H1, Intro, Page, PageContent, Section } from "@/components/Layout";
import { initLingui, PageLangParam } from "@/initLingui";
import { createClient } from "@/lib/supabase/server";
import { generateHreflangAlternates } from "@/lib/utils";
import { Trans, useLingui } from "@lingui/react/macro";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";

export async function generateMetadata(
  props: PropsWithChildren<PageLangParam>,
) {
  const lang = (await props.params).lang;
  initLingui(lang);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useLingui();
  return {
    title: t`Notifications`,
    description: t`Your notifications`,
    alternates: generateHreflangAlternates(lang, "/notifications"),
  };
}

export default async function Notifications(
  props: PropsWithChildren<PageLangParam>,
) {
  const lang = (await props.params).lang;
  initLingui(lang);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${lang}/login`);
  }

  return (
    <Page>
      <PageContent>
        <Section>
          <H1>
            <Trans>Notifications</Trans>
          </H1>
          <Intro>
            <Trans>Welcome, {user.email}!</Trans>
          </Intro>
          <p className="mt-4 text-muted-foreground">
            <Trans>You have no new notifications.</Trans>
          </p>
        </Section>
      </PageContent>
    </Page>
  );
}
