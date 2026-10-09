import { describe, expect, it } from "vitest";

import {
  compareScenario,
  createPlan,
  describeComparison,
  planLabel,
  SCENARIO_YEAR,
  scenarioTitle,
  type TaxScenario,
} from "./scenario";
import { inProvince, provinceName, toScenarioLang } from "./scenarioText";

const scenario: TaxScenario = {
  income: 100000,
  plans: [
    createPlan("british-columbia"),
    { ...createPlan("british-columbia"), provincialBpa: 30000 },
    createPlan("quebec"),
  ],
};

describe("French scenario text", () => {
  it("maps locales, defaulting to English", () => {
    expect(toScenarioLang("fr")).toBe("fr");
    expect(toScenarioLang("en")).toBe("en");
    expect(toScenarioLang(undefined)).toBe("en");
  });

  it("uses French province names and the right preposition", () => {
    expect(provinceName("british-columbia", "fr")).toBe("Colombie-Britannique");
    expect(inProvince("quebec", "fr")).toBe("au Québec");
    expect(inProvince("prince-edward-island", "fr")).toBe(
      "à l'Île-du-Prince-Édouard",
    );
    expect(inProvince("northwest-territories", "fr")).toBe(
      "dans les Territoires du Nord-Ouest",
    );
    expect(inProvince("ontario", "en")).toBe("in Ontario");
  });

  it("labels plans and titles scenarios in French", () => {
    expect(
      scenario.plans.map((p, i) => planLabel(p, i, scenario.plans, "fr")),
    ).toEqual([
      `Colombie-Britannique ${SCENARIO_YEAR}`,
      "Changement proposé",
      `Québec ${SCENARIO_YEAR}`,
    ]);
    expect(scenarioTitle(scenario, "fr")).toBe(
      "Colombie-Britannique : changement fiscal proposé",
    );
  });

  it("describes comparisons in French", () => {
    const text = describeComparison(
      scenario,
      compareScenario(scenario, "fr")!,
      "fr",
    );
    expect(text).toMatch(
      /^Pour un revenu de \$100,000\. Changement proposé : /,
    );
    expect(text).toContain("de moins par année que Colombie-Britannique");
    expect(text).toMatch(/\d+,\d %/); // French decimal comma
  });
});
