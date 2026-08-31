import { describe, expect, it } from "vitest";

import { formatCompactCurrency } from "./format-compact-currency";

describe("formatCompactCurrency", () => {
  it("pins English Canadian compact currency without trailing zeros", () => {
    expect(formatCompactCurrency(7_301_415)).toBe("$7.3M");
    expect(formatCompactCurrency(6_231_372)).toBe("$6.23M");
    expect(formatCompactCurrency(569_000)).toBe("$569K");
    expect(formatCompactCurrency(999_950)).toBe("$999.95K");
    expect(formatCompactCurrency(1_000_000_000)).toBe("$1B");
    expect(formatCompactCurrency(999)).toBe("$999");
    expect(formatCompactCurrency(0)).toBe("$0");
    expect(formatCompactCurrency(-7_301_415)).toBe("-$7.3M");
  });

  it("pins French Canadian compact currency and sign placement", () => {
    const options = { locale: "fr-CA" };

    expect(formatCompactCurrency(7_301_415, options)).toBe("7,3\u00a0M\u00a0$");
    expect(formatCompactCurrency(569_000, options)).toBe("569\u00a0k\u00a0$");
    expect(formatCompactCurrency(1_000_000_000, options)).toBe(
      "1\u00a0G\u00a0$",
    );
    expect(formatCompactCurrency(0, options)).toBe("0\u00a0$");
    expect(formatCompactCurrency(-7_301_415, options)).toBe(
      "-7,3\u00a0M\u00a0$",
    );
  });

  it("supports the Sankey precision policy", () => {
    expect(
      formatCompactCurrency(7_301_415, {
        currency: "USD",
        locale: "en-US",
        maximumFractionDigits: 1,
      }),
    ).toBe("$7.3M");
  });
});
