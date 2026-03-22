/**
 * Unit tests for eligibility policy module.
 *
 * Tests the pure rule-evaluation logic in packages/policies/src/eligibility/.
 * These tests do not require a database — they test the function
 * `evaluateEligibility(inputs, activeRules)` directly.
 */

import { describe, it, expect } from "vitest";
import { evaluateEligibility } from "../../packages/policies/src/eligibility/evaluateEligibility";

const VALID_INPUTS = {
  submittedInEnglish: true,
  alignedWithCall: true,
  primaryObjectiveIsRd: true,
  meetsEuropeanDimension: "true" as const,
  requestedBudgetKEur: 50,
  firstTimeApplicantInProgramme: true,
};

const ALL_RULES = [
  "submittedInEnglish",
  "alignedWithCall",
  "primaryObjectiveIsRd",
  "meetsEuropeanDimension",
  "requestedBudgetKEur",
];

describe("evaluateEligibility", () => {
  it("returns eligible when all active rules pass", () => {
    const result = evaluateEligibility(VALID_INPUTS, ALL_RULES);
    expect(result.status).toBe("eligible");
    expect(result.failureReasons).toHaveLength(0);
  });

  it("returns ineligible when submittedInEnglish is false", () => {
    const inputs = { ...VALID_INPUTS, submittedInEnglish: false };
    const result = evaluateEligibility(inputs, ALL_RULES);
    expect(result.status).toBe("ineligible");
    expect(result.failureReasons).toContain("submittedInEnglish");
  });

  it("returns ineligible when alignedWithCall is false", () => {
    const inputs = { ...VALID_INPUTS, alignedWithCall: false };
    const result = evaluateEligibility(inputs, ALL_RULES);
    expect(result.status).toBe("ineligible");
    expect(result.failureReasons).toContain("alignedWithCall");
  });

  it("returns ineligible when primaryObjectiveIsRd is false", () => {
    const inputs = { ...VALID_INPUTS, primaryObjectiveIsRd: false };
    const result = evaluateEligibility(inputs, ALL_RULES);
    expect(result.status).toBe("ineligible");
    expect(result.failureReasons).toContain("primaryObjectiveIsRd");
  });

  it("returns ineligible when meetsEuropeanDimension is false", () => {
    const inputs = { ...VALID_INPUTS, meetsEuropeanDimension: "false" as const };
    const result = evaluateEligibility(inputs, ALL_RULES);
    expect(result.status).toBe("ineligible");
    expect(result.failureReasons).toContain("meetsEuropeanDimension");
  });

  it("accepts not_applicable for meetsEuropeanDimension", () => {
    const inputs = { ...VALID_INPUTS, meetsEuropeanDimension: "not_applicable" as const };
    const result = evaluateEligibility(inputs, ALL_RULES);
    expect(result.status).toBe("eligible");
  });

  it("returns ineligible when budget exceeds call limit", () => {
    const inputs = { ...VALID_INPUTS, requestedBudgetKEur: 501 };
    const result = evaluateEligibility(inputs, ALL_RULES);
    expect(result.status).toBe("ineligible");
    expect(result.failureReasons).toContain("requestedBudgetKEur");
  });

  it("collects multiple failure reasons", () => {
    const inputs = {
      ...VALID_INPUTS,
      submittedInEnglish: false,
      alignedWithCall: false,
    };
    const result = evaluateEligibility(inputs, ALL_RULES);
    expect(result.status).toBe("ineligible");
    expect(result.failureReasons).toContain("submittedInEnglish");
    expect(result.failureReasons).toContain("alignedWithCall");
    expect(result.failureReasons.length).toBeGreaterThanOrEqual(2);
  });

  it("respects active rule set — inactive rules are not evaluated", () => {
    // submittedInEnglish is false but its rule is not active
    const inputs = { ...VALID_INPUTS, submittedInEnglish: false };
    const activeRules = ["alignedWithCall", "primaryObjectiveIsRd"];
    const result = evaluateEligibility(inputs, activeRules);
    expect(result.status).toBe("eligible");
    expect(result.failureReasons).toHaveLength(0);
  });

  it("records exact inputs in result", () => {
    const result = evaluateEligibility(VALID_INPUTS, ALL_RULES);
    expect(result.inputs).toEqual(VALID_INPUTS);
    expect(result.activeRules).toEqual(ALL_RULES);
  });
});
