"use client";

import { SpendingPageContent } from "@/app/[lang]/(main)/federal/spending/page";
import { useLingui } from "@lingui/react/macro";
import { localizedPath } from "@/lib/utils";

export default function Spending() {
  const { i18n } = useLingui();

  return (
    <SpendingPageContent
      fullScreenPath={localizedPath("/spending-full-screen", i18n.locale)}
      contactPath={localizedPath("/contact", i18n.locale)}
      locale={i18n.locale}
    />
  );
}
