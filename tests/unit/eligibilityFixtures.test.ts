/**
 * Fixture-driven eligibility tests.
 *
 * Reads JSON fixtures from tests/fixtures/eligibility/ and runs
 * evaluateEligibility against each one. This pattern allows adding
 * new test cases without modifying test code.
 */

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { evaluateEligibility } from "../../packages/policies/src";

const fixturesDir = join(__dirname, "../fixtures/eligibility");

interface EligibilityFixture {
  inputs: Parameters<typeof evaluateEligibility>[0];
  activeRules: string[];
  expectedStatus: "eligible" | "ineligible";
  expectedFailureReasons: string[];
}

const fixtures: Array<{ name: string; data: EligibilityFixture }> = readdirSync(fixturesDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => ({
    name: f.replace(".json", ""),
    data: JSON.parse(readFileSync(join(fixturesDir, f), "utf-8")) as EligibilityFixture,
  }));

describe("evaluateEligibility (fixture-driven)", () => {
  for (const { name, data } of fixtures) {
    it(`fixture: ${name} → ${data.expectedStatus}`, () => {
      const result = evaluateEligibility(data.inputs, data.activeRules);
      expect(result.status).toBe(data.expectedStatus);
      expect(result.failureReasons.sort()).toEqual(data.expectedFailureReasons.sort());
    });
  }
});
