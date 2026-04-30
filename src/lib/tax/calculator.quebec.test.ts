import { describe, expect, it } from "vitest";

import { calculateDetailedTax } from "./calculator";

// These tests verify that Quebec residents are charged QPP (not CPP), QPIP,
// and a reduced EI rate, per the published Revenu Québec / CRA rates.

describe("Quebec calculator overrides", () => {
  describe("2024", () => {
    it("uses QPP (6.40% rate) instead of CPP (5.95%) for Quebec", () => {
      const detailed = calculateDetailedTax(80000, "quebec", "2024");
      // 2024 max QPP1 = ($68,500 - $3,500) * 6.40% = $4,160.00.
      // At $80,000 income, the worker is over the YMPE so the max applies.
      expect(detailed.cppContribution).toBeCloseTo(4160, 2);

      const cppLine = detailed.lineItems.find(
        (l) => l.id === "cpp-contribution",
      );
      expect(cppLine?.name).toBe("Québec Pension Plan");
    });

    it("uses QPP2 (4% on $68,500-$73,200) instead of CPP2 for Quebec", () => {
      const detailed = calculateDetailedTax(80000, "quebec", "2024");
      // Max QPP2 = ($73,200 - $68,500) * 4% = $188.00.
      expect(detailed.cpp2Contribution).toBeCloseTo(188, 2);
    });

    it("uses reduced Quebec EI rate (1.32%) on max $63,200", () => {
      const detailed = calculateDetailedTax(80000, "quebec", "2024");
      // Max Quebec EI = $63,200 * 1.32% = $834.24.
      expect(detailed.eiContribution).toBeCloseTo(834.24, 2);
    });

    it("charges QPIP (0.494% on max $94,000)", () => {
      const detailed = calculateDetailedTax(100000, "quebec", "2024");
      // Max QPIP = $94,000 * 0.494% = $464.36.
      expect(detailed.parentalInsuranceContribution).toBeCloseTo(464.36, 2);
    });

    it("does NOT charge QPIP for Ontario residents", () => {
      const detailed = calculateDetailedTax(100000, "ontario", "2024");
      expect(detailed.parentalInsuranceContribution).toBe(0);
    });

    it("uses CPP (not QPP) for Ontario residents", () => {
      const detailed = calculateDetailedTax(80000, "ontario", "2024");
      // 2024 max CPP1 = ($68,500 - $3,500) * 5.95% = $3,867.50.
      expect(detailed.cppContribution).toBeCloseTo(3867.5, 2);

      const cppLine = detailed.lineItems.find(
        (l) => l.id === "cpp-contribution",
      );
      expect(cppLine?.name).toBe("Canada Pension Plan");
    });
  });

  describe("2025", () => {
    it("uses QPP (6.40%) with YMPE $71,300 → max $4,339.20", () => {
      const detailed = calculateDetailedTax(100000, "quebec", "2025");
      expect(detailed.cppContribution).toBeCloseTo(4339.2, 2);
    });

    it("uses QPP2 (4% on $71,300-$81,200) → max $396", () => {
      const detailed = calculateDetailedTax(100000, "quebec", "2025");
      expect(detailed.cpp2Contribution).toBeCloseTo(396, 2);
    });

    it("uses reduced Quebec EI rate (1.31%) on max $65,700 → max $860.67", () => {
      const detailed = calculateDetailedTax(100000, "quebec", "2025");
      expect(detailed.eiContribution).toBeCloseTo(860.67, 2);
    });

    it("charges QPIP (0.494% on max $98,000) → max $484.12", () => {
      const detailed = calculateDetailedTax(100000, "quebec", "2025");
      expect(detailed.parentalInsuranceContribution).toBeCloseTo(484.12, 2);
    });
  });

  describe("2023 (no QPP2)", () => {
    it("uses QPP (6.40%) with YMPE $66,600 → max $4,038.40", () => {
      const detailed = calculateDetailedTax(80000, "quebec", "2023");
      expect(detailed.cppContribution).toBeCloseTo(4038.4, 2);
    });

    it("does not charge QPP2 in 2023 (introduced in 2024)", () => {
      const detailed = calculateDetailedTax(80000, "quebec", "2023");
      expect(detailed.cpp2Contribution).toBe(0);
    });
  });

  it("low income only pays the rated portion (proportional)", () => {
    // At $30,000 income for Quebec 2024:
    // QPP = ($30,000 - $3,500) * 6.40% = $1,696.00
    // EI = $30,000 * 1.32% = $396.00
    // QPIP = $30,000 * 0.494% = $148.20
    const detailed = calculateDetailedTax(30000, "quebec", "2024");
    expect(detailed.cppContribution).toBeCloseTo(1696, 2);
    expect(detailed.eiContribution).toBeCloseTo(396, 2);
    expect(detailed.parentalInsuranceContribution).toBeCloseTo(148.2, 2);
  });
});
