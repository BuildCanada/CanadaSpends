import { H1, Page, PageContent, Section } from "@/components/Layout";
import { initLingui, PageLangParam } from "@/initLingui";
import { createClient } from "@/lib/supabase/server";
import { generateHreflangAlternates } from "@/lib/utils";
import { useLingui } from "@lingui/react/macro";
import { PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import { Trans } from "@lingui/react/macro";
import { LoginForm } from "./login-form";

export async function generateMetadata(
  props: PropsWithChildren<PageLangParam>,
) {
  const lang = (await props.params).lang;
  initLingui(lang);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useLingui();
  return {
    title: t`Sign In`,
    description: t`Sign in to your CanadaSpends account`,
    alternates: generateHreflangAlternates(lang, "/login"),
  };
}

export default async function Login(props: PropsWithChildren<PageLangParam>) {
  const lang = (await props.params).lang;
  initLingui(lang);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(`/${lang}`);
  }

  return (
    <Page>
      <PageContent>
        <Section className="max-w-md">
          <H1>
            <Trans>Sign In</Trans>
          </H1>
          <LoginForm />
        </Section>
      </PageContent>
    </Page>
  );
}
