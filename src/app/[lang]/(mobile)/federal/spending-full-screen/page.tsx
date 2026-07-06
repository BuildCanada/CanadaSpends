import { getFederalDefaultYear } from "@/lib/federal";
import { locales } from "@/lib/constants";
import { localizedPath } from "@/lib/utils";
import { notFound, redirect } from "next/navigation";

// Yearless mobile full-screen Sankey redirects to the latest (default) year's
// data-driven full-screen page (spec §10).
export const dynamicParams = false;

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function FederalSpendingFullScreenRedirect({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const defaultYear = getFederalDefaultYear();
  if (!defaultYear) {
    notFound();
  }
  redirect(localizedPath(`/federal/spending-full-screen/${defaultYear}`, lang));
}
