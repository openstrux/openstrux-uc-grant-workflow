/**
 * Contract tests for access control enforcement.
 *
 * Tests checkAccess against the four policies in specs/access-policies.md:
 *   1. admin-all
 *   2. deny-identity-to-reviewer (hard deny)
 *   3. reviewer-blinded-assigned
 *   4. applicant-own-proposals
 *
 * No database required — checkAccess is a pure function.
 */

import { describe, it, expect } from "vitest";
import { checkAccess } from "../../packages/policies/src";
import type { AccessPrincipal, ResourceType } from "../../packages/policies/src";

const admin:     AccessPrincipal = { role: "admin",     userId: "admin-1" };
const reviewer:  AccessPrincipal = { role: "reviewer",  userId: "rev-1" };
const applicant: AccessPrincipal = { role: "applicant", userId: "app-1" };
const auditor:   AccessPrincipal = { role: "auditor",   userId: "aud-1" };

describe("checkAccess — admin-all", () => {
  const resources: ResourceType[] = [
    "Submission", "ProposalVersion", "ApplicantIdentity",
    "BlindedPacket", "EligibilityRecord", "AuditEvent",
  ];

  for (const resource of resources) {
    it(`admin can read ${resource}`, () => {
      expect(checkAccess(admin, resource, "read")).toBe(true);
    });
    it(`admin can write ${resource}`, () => {
      expect(checkAccess(admin, resource, "write")).toBe(true);
    });
  }

  it("admin can delete Submission", () => {
    expect(checkAccess(admin, "Submission", "delete")).toBe(true);
  });
});

describe("checkAccess — deny-identity-to-reviewer (hard deny)", () => {
  it("reviewer is denied read on ApplicantIdentity", () => {
    expect(checkAccess(reviewer, "ApplicantIdentity", "read")).toBe(false);
  });

  it("reviewer is denied write on ApplicantIdentity", () => {
    expect(checkAccess(reviewer, "ApplicantIdentity", "write")).toBe(false);
  });
});

describe("checkAccess — reviewer-blinded-assigned", () => {
  it("reviewer can read BlindedPacket", () => {
    expect(checkAccess(reviewer, "BlindedPacket", "read")).toBe(true);
  });

  it("reviewer cannot write BlindedPacket", () => {
    expect(checkAccess(reviewer, "BlindedPacket", "write")).toBe(false);
  });

  it("reviewer cannot read Submission", () => {
    expect(checkAccess(reviewer, "Submission", "read")).toBe(false);
  });

  it("reviewer cannot read ProposalVersion", () => {
    expect(checkAccess(reviewer, "ProposalVersion", "read")).toBe(false);
  });
});

describe("checkAccess — applicant-own-proposals", () => {
  it("applicant can read own Submission", () => {
    expect(checkAccess(applicant, "Submission", "read", { ownerId: "app-1" })).toBe(true);
  });

  it("applicant can write own Submission", () => {
    expect(checkAccess(applicant, "Submission", "write", { ownerId: "app-1" })).toBe(true);
  });

  it("applicant cannot read another applicant's Submission", () => {
    expect(checkAccess(applicant, "Submission", "read", { ownerId: "app-2" })).toBe(false);
  });

  it("applicant cannot delete own Submission", () => {
    expect(checkAccess(applicant, "Submission", "delete", { ownerId: "app-1" })).toBe(false);
  });

  it("applicant cannot access BlindedPacket", () => {
    expect(checkAccess(applicant, "BlindedPacket", "read", { ownerId: "app-1" })).toBe(false);
  });

  it("applicant cannot read EligibilityRecord failure reasons via direct resource access", () => {
    expect(checkAccess(applicant, "EligibilityRecord", "read", { ownerId: "app-2" })).toBe(false);
  });
});

describe("checkAccess — auditor", () => {
  it("auditor can read AuditEvent", () => {
    expect(checkAccess(auditor, "AuditEvent", "read")).toBe(true);
  });

  it("auditor cannot write AuditEvent", () => {
    expect(checkAccess(auditor, "AuditEvent", "write")).toBe(false);
  });

  it("auditor cannot read Submission", () => {
    expect(checkAccess(auditor, "Submission", "read")).toBe(false);
  });
});
