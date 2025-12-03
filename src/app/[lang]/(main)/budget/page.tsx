"use client";

import { BudgetPageContent } from "@/app/[lang]/(main)/federal/budget/page";
import { useLingui } from "@lingui/react/macro";
import { localizedPath } from "@/lib/utils";

export default function Budget() {
  const { i18n } = useLingui();

  return (
    <BudgetPageContent
      budgetPath={localizedPath("/budget", i18n.locale)}
      fullScreenPath={localizedPath("/budget-full-screen", i18n.locale)}
      contactPath={localizedPath("/contact", i18n.locale)}
      locale={i18n.locale}
    />
  );
}
