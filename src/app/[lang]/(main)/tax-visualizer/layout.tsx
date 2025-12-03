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
    title: t`Tax Visualizer | Canada Spends`,
    description: t`See how your taxes are spent across federal and provincial programs. Interactive calculator for Canadian taxpayers.`,
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
