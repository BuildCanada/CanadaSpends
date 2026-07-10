import { getFederalDefaultYear } from "@/lib/federal";
import { locales } from "@/lib/constants";
import { localizedPath } from "@/lib/utils";
import { notFound, redirect } from "next/navigation";

// The yearless /federal/spending URL serves the latest (default) fiscal year
// per spec §10. It redirects to /{lang}/federal/spending/{defaultYear}, which
// is the canonical data-driven overview. The 14 legacy department slugs are
// redirected at the next.config.ts level.
export const dynamicParams = false;

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function FederalSpendingRedirect({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const defaultYear = getFederalDefaultYear();
  if (!defaultYear) {
    notFound();
  }
  redirect(localizedPath(`/federal/spending/${defaultYear}`, lang));
}
