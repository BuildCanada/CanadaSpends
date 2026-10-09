import { describe, expect, it } from "vitest";

import { calculateDetailedTax } from "./calculator";
import { getTaxConfig } from "./configs";
import {
  buildRateCurve,
  compareScenario,
  createDefaultScenario,
  createPlan,
  decodeBrackets,
  defaultScenarioTitle,
  encodeBrackets,
  parseScenario,
  planLabel,
  scenarioHasChanges,
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

describe("scenario URL params", () => {
  it("omits overrides that match current law", () => {
    const scenario = createDefaultScenario();
    const { province, year } = scenario.plans[1];
    const config = getTaxConfig(year, province)!;
    scenario.plans[1].federalBrackets = config.federal.incomeTax.brackets;
    scenario.plans[1].federalBpa = config.federal.incomeTax.basicPersonalAmount;

    const params = serializeScenario(scenario);
    expect(params.has("b.fb")).toBe(false);
    expect(params.has("b.fbpa")).toBe(false);
    expect(scenarioHasChanges(scenario)).toBe(false);
  });

  it("round-trips a multi-plan scenario", () => {
    const scenario: TaxScenario = {
      title: "Three ways to do it",
      income: 85000,
      plans: [
        createPlan("ontario", "2025"),
        {
          ...createPlan("ontario", "2025"),
          name: "Flat tax",
          federalBrackets: decodeBrackets("0-20"),
          federalBpa: 25000,
          provincialBrackets: decodeBrackets("0-5_100000-10"),
          provincialBpa: 15000,
          removeSurtax: true,
          removeHealthPremium: true,
        },
        createPlan("alberta", "2026"),
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
    const config = getTaxConfig("2026", "ontario")!;
    const scenario: TaxScenario = {
      title: "  A plan  with spaces ",
      income: 85000.4,
      plans: [
        createPlan("ontario", "2026"),
        {
          ...createPlan("ontario", "2026"),
          name: " Mine ",
          // Same as current law: dropped from the URL
          federalBpa: config.federal.incomeTax.basicPersonalAmount,
          provincialBrackets: decodeBrackets("0-5_100000-10"),
          removeSurtax: true,
        },
        createPlan("alberta", "2025"),
      ],
    };
    const query = serializeScenario(scenario).toString();
    expect(
      serializeScenario(parseScenario(new URLSearchParams(query))).toString(),
    ).toBe(query);
    // Next.js passes searchParams as an object on the server
    const asObject = Object.fromEntries(new URLSearchParams(query));
    expect(serializeScenario(parseScenario(asObject)).toString()).toBe(query);
  });

  it("reads legacy single-plan links as current law vs. the plan", () => {
    const scenario = parseScenario(
      new URLSearchParams(
        "title=Eby&income=400000&province=BC&year=2026&pb=0-5.6_190405-18.8",
      ),
    );
    expect(scenario.plans).toHaveLength(2);
    expect(scenario.plans[0]).toEqual(createPlan("british-columbia", "2026"));
    expect(scenario.plans[1].province).toBe("british-columbia");
    expect(scenario.plans[1].provincialBrackets).toEqual(
      decodeBrackets("0-5.6_190405-18.8"),
    );
  });

  it("accepts Next.js searchParams objects", () => {
    const scenario = parseScenario({
      title: ["  Hello  "],
      income: "50000",
      "a.province": "qc",
      "a.year": "2024",
      "b.province": "on",
    });
    expect(scenario.title).toBe("Hello");
    expect(scenario.income).toBe(50000);
    expect(scenario.plans[0].province).toBe("quebec");
    expect(scenario.plans[0].year).toBe("2024");
    // Missing year falls back to the reference plan's year
    expect(scenario.plans[1].year).toBe("2024");
  });

  it("falls back to defaults for invalid values", () => {
    const scenario = parseScenario(
      new URLSearchParams("income=-5&a.province=XX&a.year=1999&a.fbpa=nope"),
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
    const scenario = createDefaultScenario();
    scenario.plans = scenario.plans.map((p) => ({
      ...p,
      province: "alberta",
      removeSurtax: true,
      removeHealthPremium: true,
    }));
    expect(scenarioHasChanges(scenario)).toBe(false);
  });
});

describe("plan labels and titles", () => {
  it("names current-law plans by province and changed plans by letter", () => {
    const plans = [
      createPlan("ontario", "2025"),
      { ...createPlan("ontario", "2025"), federalBpa: 20000 },
      createPlan("alberta", "2025"),
      { ...createPlan("quebec", "2025"), name: "  Mine " },
    ];
    expect(plans.map((p, i) => planLabel(p, i, plans))).toEqual([
      "Current law",
      "Plan B",
      "Alberta",
      "Mine",
    ]);
  });

  it("adds the year only when plans span several years", () => {
    const plans = [
      createPlan("ontario", "2025"),
      createPlan("ontario", "2026"),
    ];
    expect(plans.map((p, i) => planLabel(p, i, plans))).toEqual([
      "Ontario 2025",
      "Ontario 2026",
    ]);
  });

  it("titles a province comparison 'X vs Y'", () => {
    expect(
      defaultScenarioTitle({
        title: "",
        income: 1,
        plans: [createPlan("ontario"), createPlan("alberta")],
      }),
    ).toBe("Ontario vs Alberta");
  });
});

describe("compareScenario", () => {
  it("matches the standard calculator when nothing changes", () => {
    const comparison = compareScenario(createDefaultScenario())!;
    const expected = calculateDetailedTax(100000, "ontario", "2026");
    for (const plan of comparison.plans) {
      expect(plan.result.totalTax).toBeCloseTo(expected.totalTax, 6);
      expect(plan.difference).toBeCloseTo(0, 6);
    }
  });

  it("compares provinces against the first plan", () => {
    const comparison = compareScenario({
      title: "",
      income: 120000,
      plans: [createPlan("ontario", "2025"), createPlan("alberta", "2025")],
    })!;
    const on = calculateDetailedTax(120000, "ontario", "2025").totalTax;
    const ab = calculateDetailedTax(120000, "alberta", "2025").totalTax;
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
    const scenario = createDefaultScenario();
    scenario.plans[1] = {
      ...createPlan("alberta"),
      federalBrackets: decodeBrackets("0-20"),
      federalBpa: 0,
    };
    const plan = compareScenario(scenario)!.plans[1];
    // Flat 20% with no BPA credit, applied to taxable income (after the
    // line 22215 CPP enhanced deduction).
    const taxable = 100000 - plan.result.cppQppEnhancedDeduction;
    expect(plan.result.federalIncomeTax).toBeCloseTo(taxable * 0.2, 6);
  });

  it("builds one curve value per plan", () => {
    const comparison = compareScenario({
      title: "",
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
