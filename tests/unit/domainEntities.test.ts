/**
 * Unit tests for domain entity validation.
 *
 * Tests Zod schemas in packages/domain/src/schemas/ to ensure
 * all entities match specs/domain-model.md.
 */

import { describe, it, expect } from "vitest";
import {
  SubmissionSchema,
  ProposalVersionSchema,
  EligibilityInputsSchema,
  AuditEventSchema,
} from "../../packages/domain/src/schemas";

describe("SubmissionSchema", () => {
  it("accepts valid submission", () => {
    const result = SubmissionSchema.safeParse({
      id: "sub-001",
      callId: "call-2026-q1",
      applicantAlias: "researcher-42",
      status: "submitted",
      submittedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown status", () => {
    const result = SubmissionSchema.safeParse({
      id: "sub-001",
      callId: "call-2026-q1",
      applicantAlias: "researcher-42",
      status: "unknown_state",
      submittedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it("requires applicantAlias", () => {
    const result = SubmissionSchema.safeParse({
      id: "sub-001",
      callId: "call-2026-q1",
      status: "draft",
      submittedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});

describe("ProposalVersionSchema", () => {
  it("accepts valid proposal version", () => {
    const result = ProposalVersionSchema.safeParse({
      id: "pv-001",
      submissionId: "sub-001",
      versionNumber: 1,
      isEffective: true,
      title: "Privacy-preserving DNS resolver",
      abstract: "A summary of the project.",
      requestedBudgetKEur: 50,
      budgetUsage: "Development and testing.",
      tasksBreakdown: "T1: Implementation — 3 months.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative budget", () => {
    const result = ProposalVersionSchema.safeParse({
      id: "pv-001",
      submissionId: "sub-001",
      versionNumber: 1,
      isEffective: true,
      title: "Test",
      abstract: "Test",
      requestedBudgetKEur: -10,
      budgetUsage: "N/A",
      tasksBreakdown: "N/A",
    });
    expect(result.success).toBe(false);
  });
});

describe("EligibilityInputsSchema", () => {
  it("accepts valid inputs", () => {
    const result = EligibilityInputsSchema.safeParse({
      submittedInEnglish: true,
      alignedWithCall: true,
      primaryObjectiveIsRd: true,
      meetsEuropeanDimension: "true",
      requestedBudgetKEur: 50,
      firstTimeApplicantInProgramme: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts not_applicable for meetsEuropeanDimension", () => {
    const result = EligibilityInputsSchema.safeParse({
      submittedInEnglish: true,
      alignedWithCall: true,
      primaryObjectiveIsRd: true,
      meetsEuropeanDimension: "not_applicable",
      requestedBudgetKEur: 50,
      firstTimeApplicantInProgramme: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid meetsEuropeanDimension", () => {
    const result = EligibilityInputsSchema.safeParse({
      submittedInEnglish: true,
      alignedWithCall: true,
      primaryObjectiveIsRd: true,
      meetsEuropeanDimension: "maybe",
      requestedBudgetKEur: 50,
      firstTimeApplicantInProgramme: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("AuditEventSchema", () => {
  it("accepts valid audit event", () => {
    const result = AuditEventSchema.safeParse({
      id: "ae-001",
      eventType: "submission.created",
      actorId: "user-001",
      targetType: "Submission",
      targetId: "sub-001",
      payload: {},
      timestamp: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });
});
