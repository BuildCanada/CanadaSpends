import { generateHreflangAlternates } from "@/lib/utils";
import { initLingui, PageLangParam } from "@/initLingui";
import { useLingui } from "@lingui/react/macro";
import { PropsWithChildren } from "react";

export async function generateMetadata(
  props: PropsWithChildren<PageLangParam>,
) {
  const lang = (await props.params).lang;
  initLingui(lang);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useLingui();

  return {
    title: t`Federal Budget 2025 | Canada Spends`,
    description: t`Explore Canada's federal budget with interactive visualizations and detailed analysis of government revenue and expenditures.`,
    alternates: generateHreflangAlternates(lang),
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
