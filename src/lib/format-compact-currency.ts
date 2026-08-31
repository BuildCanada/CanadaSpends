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
    { threshold: 1e12, divisor: 1e12, en: "T", fr: "T" },
    { threshold: 1e9, divisor: 1e9, en: "B", fr: "G" },
    { threshold: 1e6, divisor: 1e6, en: "M", fr: "M" },
    { threshold: 1e3, divisor: 1e3, en: "K", fr: "k" },
  ];
  const unit = units.find(({ threshold }) => absoluteAmount >= threshold);
  const scaledAmount = absoluteAmount / (unit?.divisor ?? 1);
  const number = scaledAmount
    .toFixed(maximumFractionDigits)
    .replace(/\.0+$|(?<=\.[0-9]*?)0+$/u, "")
    .replace(".", french ? "," : ".");
  const suffix = unit ? (french ? unit.fr : unit.en) : "";
  const sign = amount < 0 ? "-" : "";
  const symbol = currency === "CAD" || currency === "USD" ? "$" : currency;

  return french
    ? `${sign}${number}${suffix ? `\u00a0${suffix}` : ""}\u00a0${symbol}`
    : `${sign}${symbol}${number}${suffix}`;
}
