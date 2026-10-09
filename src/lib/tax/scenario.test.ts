import { describe, expect, it } from "vitest";

import { calculateDetailedTax } from "./calculator";
import { getTaxConfig } from "./configs";
import {
  buildRateCurve,
  compareScenario,
  createDefaultScenario,
  createPlan,
  decodeBrackets,
  effectivePlan,
  encodeBrackets,
  isProposal,
  normalizeScenario,
  parseScenario,
  percentToRate,
  planLabel,
  rateToPercent,
  SCENARIO_YEAR,
  scenarioHasChanges,
  scenarioTitle,
  serializeScenario,
  TaxScenario,
} from "./scenario";

describe("bracket encoding", () => {
  it("round-trips current-law federal brackets", () => {
    const brackets = getTaxConfig("2025", "ontario")!.federal.incomeTax
      .brackets;
    const encoded = encodeBrackets(brackets);
    expect(encoded).toBe("0-14.5_57375-20.5_114750-26_177882-29_253414-33");
    expect(decodeBrackets(encoded)).toEqual(brackets);
  });

  it("keeps fractional provincial rates without float noise", () => {
    const brackets = getTaxConfig("2025", "ontario")!.provincial.incomeTax
      .brackets;
    expect(encodeBrackets(brackets)).toBe(
      "0-5.05_52886-9.15_105775-11.16_150000-12.16_220000-13.16",
    );
    expect(decodeBrackets(encodeBrackets(brackets))).toEqual(brackets);
  });

  it("sorts, dedupes, clamps and anchors the first bracket at $0", () => {
    expect(decodeBrackets("90000-40_5000-10_90000-50_200000-150")).toEqual([
      { min: 0, max: 90000, rate: 0.1 },
      { min: 90000, max: 200000, rate: 0.4 },
      { min: 200000, max: null, rate: 1 },
    ]);
  });

  it("rejects garbage", () => {
    expect(decodeBrackets("abc")).toBeNull();
    expect(decodeBrackets("")).toBeNull();
    expect(decodeBrackets(null)).toBeNull();
  });
});

describe("scenario rules", () => {
  it("always compares against the current year's law", () => {
    expect(createPlan("alberta").year).toBe(SCENARIO_YEAR);
    // Years in older links are ignored
    const scenario = parseScenario(
      new URLSearchParams(
        "a.province=BC&a.year=2023&b.province=BC&b.year=2024",
      ),
    );
    expect(scenario.plans.map((p) => p.year)).toEqual([
      SCENARIO_YEAR,
      SCENARIO_YEAR,
    ]);
  });

  it("forces the reference to current law", () => {
    const scenario = parseScenario(
      new URLSearchParams("a.province=ON&a.fbpa=50000&b.province=ON"),
    );
    expect(scenario.plans[0]).toEqual(createPlan("ontario"));
  });

  it("keeps changes only for proposals in the reference province", () => {
    const scenario = parseScenario(
      new URLSearchParams(
        "a.province=BC&b.province=BC&b.pbpa=20000&c.province=AB&c.fbpa=50000",
      ),
    );
    expect(isProposal(1, scenario.plans)).toBe(true);
    expect(scenario.plans[1].provincialBpa).toBe(20000);
    // Other provinces are their current law
    expect(isProposal(2, scenario.plans)).toBe(false);
    expect(scenario.plans[2]).toEqual(createPlan("alberta"));
  });

  it("ignores titles and names in older links", () => {
    const params = serializeScenario(
      parseScenario(
        new URLSearchParams(
          "title=Anything+at+all&a.province=ON&b.province=ON&b.name=Mine&b.fbpa=20000",
        ),
      ),
    );
    expect(params.has("title")).toBe(false);
    expect(params.has("b.name")).toBe(false);
    expect(params.get("b.fbpa")).toBe("20000");
  });
});

describe("scenario URL params", () => {
  it("omits overrides that match current law", () => {
    const scenario = createDefaultScenario();
    const config = getTaxConfig(SCENARIO_YEAR, "ontario")!;
    scenario.plans[1].federalBrackets = config.federal.incomeTax.brackets;
    scenario.plans[1].federalBpa = config.federal.incomeTax.basicPersonalAmount;

    const params = serializeScenario(scenario);
    expect(params.has("b.fb")).toBe(false);
    expect(params.has("b.fbpa")).toBe(false);
    expect(scenarioHasChanges(scenario)).toBe(false);
  });

  it("round-trips a multi-plan scenario", () => {
    const scenario: TaxScenario = {
      income: 85000,
      plans: [
        createPlan("ontario"),
        {
          ...createPlan("ontario"),
          federalBrackets: decodeBrackets("0-20"),
          federalBpa: 25000,
          provincialBrackets: decodeBrackets("0-5_100000-10"),
          provincialBpa: 15000,
          removeSurtax: true,
          removeHealthPremium: true,
        },
        createPlan("alberta"),
      ],
    };

    const params = serializeScenario(scenario);
    expect(params.get("b.fb")).toBe("0-20");
    expect(params.get("c.province")).toBe("AB");
    expect(params.has("d.province")).toBe(false);
    expect(parseScenario(params)).toEqual(scenario);
  });

  it("serializes to the same query after a round trip through the URL", () => {
    // The page's og:image is built from parse(searchParams); the browser
    // warms the cache with serialize(scenario). They must match exactly or
    // crawlers miss the cached image.
    const scenario: TaxScenario = {
      income: 500_000_000,
      plans: [
        createPlan("ontario"),
        {
          ...createPlan("ontario"),
          federalBpa: 200_000_000,
          provincialBrackets: decodeBrackets("0-5_100000-10"),
          removeSurtax: true,
        },
        // A change to another province isn't allowed: dropped
        { ...createPlan("alberta"), federalBpa: 1 },
      ],
    };
    const query = serializeScenario(scenario).toString();
    const parsed = parseScenario(new URLSearchParams(query));
    expect(serializeScenario(parsed).toString()).toBe(query);
    expect(parsed.income).toBe(100_000_000);
    expect(parsed.plans[1].federalBpa).toBe(100_000_000);
    expect(parsed.plans[2]).toEqual(createPlan("alberta"));
    // Next.js passes searchParams as an object on the server
    const asObject = Object.fromEntries(new URLSearchParams(query));
    expect(serializeScenario(parseScenario(asObject)).toString()).toBe(query);
  });

  it("reads legacy single-plan links as current law vs. a proposal", () => {
    const scenario = parseScenario(
      new URLSearchParams(
        "title=Eby&income=400000&province=BC&year=2026&pb=0-5.6_190405-18.8",
      ),
    );
    expect(scenario.plans).toHaveLength(2);
    expect(scenario.plans[0]).toEqual(createPlan("british-columbia"));
    expect(scenario.plans[1].province).toBe("british-columbia");
    expect(scenario.plans[1].provincialBrackets).toEqual(
      decodeBrackets("0-5.6_190405-18.8"),
    );
  });

  it("accepts Next.js searchParams objects", () => {
    const scenario = parseScenario({
      income: ["50000"],
      "a.province": "qc",
      "b.province": "on",
    });
    expect(scenario.income).toBe(50000);
    expect(scenario.plans.map((p) => p.province)).toEqual([
      "quebec",
      "ontario",
    ]);
  });

  it("falls back to defaults for invalid values", () => {
    const scenario = parseScenario(
      new URLSearchParams("income=-5&a.province=XX&a.fbpa=nope"),
    );
    const defaults = createDefaultScenario();
    expect(scenario.income).toBe(defaults.income);
    expect(scenario.plans[0]).toEqual(defaults.plans[0]);
  });

  it("stops reading plans at the first gap", () => {
    const scenario = parseScenario(
      new URLSearchParams("a.province=ON&b.province=AB&d.province=BC"),
    );
    expect(scenario.plans.map((p) => p.province)).toEqual([
      "ontario",
      "alberta",
    ]);
  });

  it("ignores surtax / health premium toggles for provinces without them", () => {
    const scenario = normalizeScenario({
      income: 100000,
      plans: [
        createPlan("alberta"),
        {
          ...createPlan("alberta"),
          removeSurtax: true,
          removeHealthPremium: true,
        },
      ],
    });
    expect(scenarioHasChanges(scenario)).toBe(false);
  });
});

describe("neutral labels and titles", () => {
  it("labels current law and a single proposal", () => {
    const plans = [
      createPlan("ontario"),
      { ...createPlan("ontario"), federalBpa: 20000 },
    ];
    expect(plans.map((p, i) => planLabel(p, i, plans))).toEqual([
      `Ontario ${SCENARIO_YEAR}`,
      "Proposed change",
    ]);
  });

  it("numbers several proposals and names other provinces", () => {
    const plans = [
      createPlan("british-columbia"),
      { ...createPlan("british-columbia"), federalBpa: 20000 },
      createPlan("alberta"),
      { ...createPlan("british-columbia"), provincialBpa: 20000 },
    ];
    expect(plans.map((p, i) => planLabel(p, i, plans))).toEqual([
      `British Columbia ${SCENARIO_YEAR}`,
      "Proposal 1",
      `Alberta ${SCENARIO_YEAR}`,
      "Proposal 2",
    ]);
  });

  it("titles proposals '<Province> Proposed Tax Change'", () => {
    expect(
      scenarioTitle({
        income: 1,
        plans: [
          createPlan("british-columbia"),
          { ...createPlan("british-columbia"), provincialBpa: 20000 },
          createPlan("alberta"),
        ],
      }),
    ).toBe("British Columbia Proposed Tax Change");
  });

  it("titles a comparison of current law only '<Province> Tax Comparison'", () => {
    expect(
      scenarioTitle({
        income: 1,
        plans: [createPlan("ontario"), createPlan("alberta")],
      }),
    ).toBe("Ontario Tax Comparison");
  });
});

describe("rates and effective overrides", () => {
  it("round-trips percentages typed in the editor exactly", () => {
    for (const rate of [0.0505, 0.0879, 0.108, 0.1667, 0.0598, 0.1229]) {
      expect(percentToRate(rateToPercent(rate))).toBe(rate);
    }
  });

  it("drops overrides that don't change anything", () => {
    const plan = {
      ...createPlan("alberta"),
      // Alberta has no surtax or health premium
      removeSurtax: true,
      removeHealthPremium: true,
      federalBpa: getTaxConfig(SCENARIO_YEAR, "alberta")!.federal.incomeTax
        .basicPersonalAmount,
      provincialBpa: 30000,
    };
    expect(effectivePlan(plan)).toEqual({
      ...createPlan("alberta"),
      provincialBpa: 30000,
    });
  });
});

describe("compareScenario", () => {
  it("matches the standard calculator when nothing changes", () => {
    const comparison = compareScenario(createDefaultScenario())!;
    const expected = calculateDetailedTax(100000, "ontario", SCENARIO_YEAR);
    for (const plan of comparison.plans) {
      expect(plan.result.totalTax).toBeCloseTo(expected.totalTax, 6);
      expect(plan.difference).toBeCloseTo(0, 6);
    }
  });

  it("compares provinces against the first plan", () => {
    const comparison = compareScenario({
      income: 120000,
      plans: [createPlan("ontario"), createPlan("alberta")],
    })!;
    const on = calculateDetailedTax(120000, "ontario", SCENARIO_YEAR).totalTax;
    const ab = calculateDetailedTax(120000, "alberta", SCENARIO_YEAR).totalTax;
    expect(comparison.plans[1].difference).toBeCloseTo(ab - on, 6);
  });

  it("removing the Ontario surtax and health premium cuts exactly those amounts", () => {
    const scenario = createDefaultScenario();
    scenario.income = 200000;
    scenario.plans[1] = {
      ...scenario.plans[1],
      removeSurtax: true,
      removeHealthPremium: true,
    };
    const [reference, plan] = compareScenario(scenario)!.plans;
    expect(plan.result.surtax).toBe(0);
    expect(plan.result.healthPremium).toBe(0);
    expect(plan.difference).toBeCloseTo(
      -(reference.result.surtax + reference.result.healthPremium),
      6,
    );
  });

  it("applies custom federal brackets and BPA", () => {
    const scenario: TaxScenario = {
      income: 100000,
      plans: [
        createPlan("alberta"),
        {
          ...createPlan("alberta"),
          federalBrackets: decodeBrackets("0-20"),
          federalBpa: 0,
        },
      ],
    };
    const plan = compareScenario(scenario)!.plans[1];
    // Flat 20% with no BPA credit, applied to taxable income (after the
    // line 22215 CPP enhanced deduction).
    const taxable = 100000 - plan.result.cppQppEnhancedDeduction;
    expect(plan.result.federalIncomeTax).toBeCloseTo(taxable * 0.2, 6);
  });

  it("builds one curve value per plan", () => {
    const comparison = compareScenario({
      income: 100000,
      plans: [
        createPlan("ontario"),
        createPlan("alberta"),
        createPlan("quebec"),
      ],
    })!;
    const curve = buildRateCurve(comparison, 200000, 4);
    expect(curve).toHaveLength(5);
    expect(curve.every((p) => p.rates.length === 3)).toBe(true);
  });
});
