import { provinceNames } from "../provinceNames";

/**
 * Generated text for tax scenarios (titles, labels, link descriptions and
 * the social image). These are built outside React, so they're localized
 * here rather than through Lingui.
 */
export type ScenarioLang = "en" | "fr";

export function toScenarioLang(locale: string | undefined): ScenarioLang {
  return locale === "fr" ? "fr" : "en";
}

const PROVINCE_NAMES_FR: Record<string, string> = {
  alberta: "Alberta",
  "british-columbia": "Colombie-Britannique",
  manitoba: "Manitoba",
  "new-brunswick": "Nouveau-Brunswick",
  "newfoundland-and-labrador": "Terre-Neuve-et-Labrador",
  "northwest-territories": "Territoires du Nord-Ouest",
  "nova-scotia": "Nouvelle-Écosse",
  nunavut: "Nunavut",
  ontario: "Ontario",
  "prince-edward-island": "Île-du-Prince-Édouard",
  quebec: "Québec",
  saskatchewan: "Saskatchewan",
  yukon: "Yukon",
};

// "in <province>" in French depends on the province's name
const PROVINCE_IN_FR: Record<string, string> = {
  alberta: "en Alberta",
  "british-columbia": "en Colombie-Britannique",
  manitoba: "au Manitoba",
  "new-brunswick": "au Nouveau-Brunswick",
  "newfoundland-and-labrador": "à Terre-Neuve-et-Labrador",
  "northwest-territories": "dans les Territoires du Nord-Ouest",
  "nova-scotia": "en Nouvelle-Écosse",
  nunavut: "au Nunavut",
  ontario: "en Ontario",
  "prince-edward-island": "à l'Île-du-Prince-Édouard",
  quebec: "au Québec",
  saskatchewan: "en Saskatchewan",
  yukon: "au Yukon",
};

export function provinceName(slug: string, lang: ScenarioLang = "en"): string {
  const names = lang === "fr" ? PROVINCE_NAMES_FR : provinceNames;
  return names[slug] ?? slug;
}

/** "in British Columbia" / "en Colombie-Britannique" */
export function inProvince(slug: string, lang: ScenarioLang = "en"): string {
  return lang === "fr"
    ? (PROVINCE_IN_FR[slug] ?? `en ${provinceName(slug, lang)}`)
    : `in ${provinceName(slug, lang)}`;
}

export const SCENARIO_TEXT = {
  en: {
    simulatedChange: "Simulated change",
    simulatedChangeN: (n: number) => `Simulated change ${n}`,
    title: (province: string) => `Simulated Tax Change: ${province}`,
    atIncome: (income: string) => `At ${income} income`,
    marginal: "marginal",
    sameAs: (label: string) => `same as ${label}`,
    moreOrLess: (amount: string, more: boolean, label: string) =>
      `${amount} ${more ? "more" : "less"} a year than ${label}`,
    referenceOnly: (income: string, label: string, tax: string, rate: string) =>
      `At ${income} income, ${label} means ${tax} in tax (${rate}% marginal).`,
    // Social image
    wouldPay: (income: string, where: string) =>
      `A person earning ${income}${where ? ` ${where}` : ""} would pay…`,
    differenceFrom: (label: string) => `Change in annual tax vs ${label}`,
    taxPaidByIncome: "Total annual tax by income",
    noChange: "No change",
    disclosure:
      "Tax changes entered by a Canada Spends Tax Simulator user. Canada Spends calculated the results but did not create or endorse them.",
  },
  fr: {
    simulatedChange: "Changement simulé",
    simulatedChangeN: (n: number) => `Changement simulé ${n}`,
    title: (province: string) => `Changement fiscal simulé : ${province}`,
    atIncome: (income: string) => `Pour un revenu de ${income}`,
    marginal: "marginal",
    sameAs: (label: string) => `identique à ${label}`,
    moreOrLess: (amount: string, more: boolean, label: string) =>
      `${amount} de ${more ? "plus" : "moins"} par année que ${label}`,
    referenceOnly: (income: string, label: string, tax: string, rate: string) =>
      `Pour un revenu de ${income}, ${label} représente ${tax} d'impôt (taux marginal de ${rate} %).`,
    wouldPay: (income: string, where: string) =>
      `Une personne gagnant ${income}${where ? ` ${where}` : ""} paierait…`,
    differenceFrom: (label: string) =>
      `Écart d'impôt annuel par rapport à ${label}`,
    taxPaidByIncome: "Impôt annuel total selon le revenu",
    noChange: "Aucun changement",
    disclosure:
      "Changements saisis par un utilisateur du Simulateur d'impôt de Canada Spends. Canada Spends a calculé les résultats, sans les créer ni les approuver.",
  },
} as const;

/**
 * A percentage: "41.3%" or, in French, "41,3 %". One decimal by default;
 * pass `exact` for statutory rates like 12.29% (up to three decimals, no
 * trailing zeros).
 */
export function formatRate(
  rate: number,
  lang: ScenarioLang = "en",
  exact = false,
): string {
  const n = new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", {
    minimumFractionDigits: exact ? 0 : 1,
    maximumFractionDigits: exact ? 3 : 1,
  }).format(rate);
  return lang === "fr" ? `${n}\u00a0%` : `${n}%`;
}

/** A number with one decimal in the locale's style ("41.3" / "41,3"). */
export function formatDecimal(value: number, lang: ScenarioLang = "en") {
  return new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}
