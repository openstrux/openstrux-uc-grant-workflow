/**
 * Contract tests for blinded packet creation.
 *
 * Verifies that the mapper strips identity fields and preserves
 * evaluable content, per FR-P1-007, FR-P1-008, FR-P1-009.
 *
 * Imports from @grant-workflow/policies barrel.
 */

import { describe, it, expect } from "vitest";
import { createBlindedPacket } from "../../packages/policies/src";
import expectedBlinded from "../fixtures/blinded-packets/expected-blinded.json";

describe("createBlindedPacket (golden test)", () => {
  const proposalVersion = {
    id: "pv-001",
    submissionId: "sub-001",
    versionNumber: 1,
    isEffective: true,
    title: "Privacy-preserving DNS resolver",
    abstract: "A DNS resolver that preserves user privacy.",
    requestedBudgetKEur: 50,
    budgetUsage: "Development (70%), testing (30%).",
    tasksBreakdown: "T1: Core implementation — 3 months.",
  };

  const applicantIdentity = {
    id: "ai-001",
    submissionId: "sub-001",
    legalName: "Jane Doe",
    email: "jane@example.com",
    country: "NL",
    organisation: "Example Foundation",
  };

  it("includes required evaluable fields in blinded content", () => {
    const packet = createBlindedPacket(proposalVersion, applicantIdentity);

    for (const field of expectedBlinded.mustContain) {
      expect(packet.content).toHaveProperty(field);
    }
  });

  it("excludes identity fields from blinded content", () => {
    const packet = createBlindedPacket(proposalVersion, applicantIdentity);

    for (const field of expectedBlinded.mustExclude) {
      expect(packet.content).not.toHaveProperty(field);
    }
  });

  it("preserves traceability via proposalVersionId (not visible to reviewer)", () => {
    const packet = createBlindedPacket(proposalVersion, applicantIdentity);
    expect(packet.proposalVersionId).toBe("pv-001");
    // The content blob itself must not contain the submission or identity link
    expect(packet.content).not.toHaveProperty("submissionId");
    expect(packet.content).not.toHaveProperty("proposalVersionId");
  });
});
