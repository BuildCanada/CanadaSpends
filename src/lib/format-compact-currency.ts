export type CompactCurrencyOptions = {
  currency?: string;
  locale?: string;
  maximumFractionDigits?: number;
};

export function formatCompactCurrency(
  amount: number,
  {
    currency = "CAD",
    locale = "en-CA",
    maximumFractionDigits = 2,
  }: CompactCurrencyOptions = {},
): string {
  const french = locale.toLowerCase().startsWith("fr");
  const absoluteAmount = Math.abs(amount);
  const units = [
    { threshold: 1, divisor: 1, en: "", fr: "" },
    { threshold: 1e3, divisor: 1e3, en: "K", fr: "k" },
    { threshold: 1e6, divisor: 1e6, en: "M", fr: "M" },
    { threshold: 1e9, divisor: 1e9, en: "B", fr: "G" },
    { threshold: 1e12, divisor: 1e12, en: "T", fr: "T" },
  ];
  let unitIndex = units.findLastIndex(
    ({ threshold }) => absoluteAmount >= threshold,
  );
  unitIndex = Math.max(unitIndex, 0);
  let unit = units[unitIndex];
  let scaledAmount = absoluteAmount / unit.divisor;
  while (
    unitIndex < units.length - 1 &&
    Number(scaledAmount.toFixed(maximumFractionDigits)) >= 1000
  ) {
    unit = units[++unitIndex];
    scaledAmount = absoluteAmount / unit.divisor;
  }
  const number = scaledAmount
    .toFixed(maximumFractionDigits)
    .replace(/\.0+$|(?<=\.[0-9]*?)0+$/u, "")
    .replace(".", french ? "," : ".");
  const suffix = french ? unit.fr : unit.en;
  const sign = amount < 0 ? "-" : "";
  const symbol = currency === "CAD" || currency === "USD" ? "$" : currency;

  return french
    ? `${sign}${number}${suffix ? `\u00a0${suffix}` : ""}\u00a0${symbol}`
    : `${sign}${symbol}${number}${suffix}`;
}
