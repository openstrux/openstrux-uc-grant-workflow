/**
 * Unit tests for access policy module.
 *
 * Tests the pure policy evaluation in packages/policies/src/access/.
 */

import { describe, it, expect } from "vitest";
import { checkAccess } from "../../packages/policies/src/access/checkAccess";

describe("checkAccess", () => {
  describe("reviewer cannot access ApplicantIdentity", () => {
    it("denies reviewer access to ApplicantIdentity read", () => {
      const result = checkAccess({
        role: "reviewer",
        resource: "ApplicantIdentity",
        operation: "read",
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/identity/i);
    });

    it("denies reviewer access to ApplicantIdentity write", () => {
      const result = checkAccess({
        role: "reviewer",
        resource: "ApplicantIdentity",
        operation: "write",
      });
      expect(result.allowed).toBe(false);
    });
  });

  describe("admin has full access", () => {
    it("allows admin read on Submission", () => {
      const result = checkAccess({ role: "admin", resource: "Submission", operation: "read" });
      expect(result.allowed).toBe(true);
    });

    it("allows admin write on EligibilityRecord", () => {
      const result = checkAccess({ role: "admin", resource: "EligibilityRecord", operation: "write" });
      expect(result.allowed).toBe(true);
    });

    it("allows admin read on ApplicantIdentity", () => {
      const result = checkAccess({ role: "admin", resource: "ApplicantIdentity", operation: "read" });
      expect(result.allowed).toBe(true);
    });
  });

  describe("applicant has limited access", () => {
    it("allows applicant read on own Submission", () => {
      const result = checkAccess({
        role: "applicant",
        resource: "Submission",
        operation: "read",
        ownResource: true,
      });
      expect(result.allowed).toBe(true);
    });

    it("denies applicant read on someone else's Submission", () => {
      const result = checkAccess({
        role: "applicant",
        resource: "Submission",
        operation: "read",
        ownResource: false,
      });
      expect(result.allowed).toBe(false);
    });

    it("denies applicant write on EligibilityRecord", () => {
      const result = checkAccess({
        role: "applicant",
        resource: "EligibilityRecord",
        operation: "write",
      });
      expect(result.allowed).toBe(false);
    });
  });

  describe("reviewer can access assigned blinded packets", () => {
    it("allows reviewer read on assigned BlindedPacket", () => {
      const result = checkAccess({
        role: "reviewer",
        resource: "BlindedPacket",
        operation: "read",
        assignedToReviewer: true,
      });
      expect(result.allowed).toBe(true);
    });

    it("denies reviewer read on unassigned BlindedPacket", () => {
      const result = checkAccess({
        role: "reviewer",
        resource: "BlindedPacket",
        operation: "read",
        assignedToReviewer: false,
      });
      expect(result.allowed).toBe(false);
    });
  });
});
