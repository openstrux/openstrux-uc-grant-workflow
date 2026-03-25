/**
 * Contract tests for workflow state transitions.
 *
 * Tests that state transitions follow openspec/specs/workflow-states.md and
 * that invalid transitions are rejected.
 *
 * Imports from @grant-workflow/policies barrel.
 */

import { describe, it, expect } from "vitest";
import { isValidTransition, getNextStatus } from "../../src/policies";

describe("workflow transitions", () => {
  it("allows draft → submitted", () => {
    expect(isValidTransition("draft", "submitted")).toBe(true);
  });

  it("allows submitted → eligible", () => {
    expect(isValidTransition("submitted", "eligible")).toBe(true);
  });

  it("allows submitted → eligibility_failed", () => {
    expect(isValidTransition("submitted", "eligibility_failed")).toBe(true);
  });

  it("allows eligible → under_review", () => {
    expect(isValidTransition("eligible", "under_review")).toBe(true);
  });

  it("rejects eligibility_failed → under_review (FR-P2-007)", () => {
    expect(isValidTransition("eligibility_failed", "under_review")).toBe(false);
  });

  it("rejects draft → eligible (must go through submitted)", () => {
    expect(isValidTransition("draft", "eligible")).toBe(false);
  });

  it("rejects under_review → draft (no backwards)", () => {
    expect(isValidTransition("under_review", "draft")).toBe(false);
  });

  describe("getNextStatus for eligibility", () => {
    it("returns eligible when check passes", () => {
      expect(getNextStatus("submitted", "eligibility_pass")).toBe("eligible");
    });

    it("returns eligibility_failed when check fails", () => {
      expect(getNextStatus("submitted", "eligibility_fail")).toBe("eligibility_failed");
    });
  });
});
