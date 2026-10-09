import type { Metadata } from "next";

import { BASE_URL } from "@/lib/constants";
import {
  compareScenario,
  describeComparison,
  parseScenario,
  scenarioHasChanges,
  scenarioTitle,
  serializeScenario,
  toScenarioLang,
} from "@/lib/tax";
import { generateHreflangAlternates } from "@/lib/utils";

import { socialImagePath } from "./socialImage";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Metadata for a scenario page: the title and description describe the
 * comparison, and the Open Graph image renders it.
 */
export function buildScenarioMetadata({
  lang,
  searchParams,
  path,
  fallbackTitle,
  fallbackDescription,
}: {
  lang: string;
  searchParams: SearchParams;
  path: string;
  fallbackTitle: string;
  fallbackDescription: string;
}): Metadata {
  const scenario = parseScenario(searchParams);
  const textLang = toScenarioLang(lang);
  const comparison = compareScenario(scenario, textLang);
  const query = serializeScenario(scenario).toString();
  const hasComparison = scenarioHasChanges(scenario);

  const heading = hasComparison
    ? scenarioTitle(scenario, textLang)
    : fallbackTitle;
  const description =
    comparison && hasComparison
      ? describeComparison(scenario, comparison, textLang)
      : fallbackDescription;
  const image = {
    url: `${BASE_URL}${socialImagePath(query, textLang)}`,
    width: 1200,
    height: 630,
    alt: heading,
  };

  return {
    title: `${heading} | Canada Spends`,
    description,
    alternates: generateHreflangAlternates(lang, path),
    openGraph: {
      title: heading,
      description,
      url: `${BASE_URL}/${lang}${path}?${query}`,
      siteName: "Canada Spends",
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: heading,
      description,
      images: [image.url],
    },
  };
}
