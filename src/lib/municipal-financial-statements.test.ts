import { describe, expect, it } from "vitest";

import { latestMunicipalFinancialYear } from "./municipal-financial-statements";

describe("latestMunicipalFinancialYear", () => {
  it("selects the maximum available year without relying on API order", () => {
    expect(
      latestMunicipalFinancialYear({ available_years: [2024, 2025, 2023] }),
    ).toBe(2025);
  });

  it("returns null when no reviewed year is available", () => {
    expect(latestMunicipalFinancialYear({ available_years: [] })).toBeNull();
    expect(latestMunicipalFinancialYear(null)).toBeNull();
  });
});
