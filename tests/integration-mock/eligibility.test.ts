/**
 * Mock-based integration tests for the eligibility service.
 *
 * Uses vitest-mock-extended to intercept PrismaClient calls — no database required.
 * These tests run during agentic generation (CLAUDE.md: pnpm test:integration:mock).
 *
 * Assertions verify return values and prisma call arguments, not persisted state.
 */

import { describe, it, expect } from "vitest";
import { mockPrisma } from "./setup";
import { submitProposal } from "../../src/server/services/submissionService";
import { runEligibilityCheck } from "../../src/server/services/eligibilityService";

async function createTestSubmission(alias: string): Promise<string> {
  const submissionId = `sub-${alias}`;

  mockPrisma.submission.create.mockResolvedValue({
    id: submissionId,
    applicantAlias: alias,
    status: "submitted",
    callId: "call-test",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);

  mockPrisma.proposalVersion.create.mockResolvedValue({
    id: `pv-${alias}`,
    submissionId,
  } as any);

  mockPrisma.blindedPacket.create.mockResolvedValue({
    id: `bp-${alias}`,
    proposalVersionId: `pv-${alias}`,
    content: {},
  } as any);

  mockPrisma.auditEvent.create.mockResolvedValue({} as any);

  const result = await submitProposal({
    callId: "call-test",
    applicantAlias: alias,
    title: "Eligibility Test Proposal",
    abstract: "For eligibility testing.",
    requestedBudgetKEur: 50,
    budgetUsage: "Development.",
    tasksBreakdown: "T1: Eligibility test.",
  });

  return result.submissionId;
}

describe("Eligibility service (mock)", () => {
  it("records eligibility check result", async () => {
    const submissionId = await createTestSubmission("test-elig-001");

    mockPrisma.eligibilityRecord.create.mockResolvedValue({
      id: "er-001",
      submissionId,
      status: "eligible",
      inputs: {},
    } as any);

    mockPrisma.submission.update.mockResolvedValue({
      id: submissionId,
      status: "eligible",
    } as any);

    const result = await runEligibilityCheck({
      submissionId,
      inputs: {
        submittedInEnglish: true,
        alignedWithCall: true,
        primaryObjectiveIsRd: true,
        meetsEuropeanDimension: "true",
        requestedBudgetKEur: 50,
        firstTimeApplicantInProgramme: true,
      },
    });

    expect(result.status).toBe("eligible");
    expect(mockPrisma.eligibilityRecord.create).toHaveBeenCalled();
    const recordData = mockPrisma.eligibilityRecord.create.mock.calls[0]?.[0]?.data;
    expect(recordData?.submissionId).toBe(submissionId);
    expect(recordData?.status).toBe("eligible");
    expect(recordData?.inputs).toBeTruthy();
  });

  it("updates submission status to eligible on pass", async () => {
    const submissionId = await createTestSubmission("test-elig-002");

    mockPrisma.eligibilityRecord.create.mockResolvedValue({
      id: "er-002",
      submissionId,
      status: "eligible",
      inputs: {},
    } as any);

    mockPrisma.submission.update.mockResolvedValue({
      id: submissionId,
      status: "eligible",
    } as any);

    await runEligibilityCheck({
      submissionId,
      inputs: {
        submittedInEnglish: true,
        alignedWithCall: true,
        primaryObjectiveIsRd: true,
        meetsEuropeanDimension: "not_applicable",
        requestedBudgetKEur: 50,
        firstTimeApplicantInProgramme: true,
      },
    });

    expect(mockPrisma.submission.update).toHaveBeenCalled();
    const updateData = mockPrisma.submission.update.mock.calls[0]?.[0]?.data;
    expect(updateData?.status).toBe("eligible");
  });

  it("updates submission status to eligibility_failed on fail", async () => {
    const submissionId = await createTestSubmission("test-elig-003");

    mockPrisma.eligibilityRecord.create.mockResolvedValue({
      id: "er-003",
      submissionId,
      status: "eligibility_failed",
      inputs: {},
    } as any);

    mockPrisma.submission.update.mockResolvedValue({
      id: submissionId,
      status: "eligibility_failed",
    } as any);

    await runEligibilityCheck({
      submissionId,
      inputs: {
        submittedInEnglish: false,
        alignedWithCall: false,
        primaryObjectiveIsRd: true,
        meetsEuropeanDimension: "true",
        requestedBudgetKEur: 50,
        firstTimeApplicantInProgramme: true,
      },
    });

    expect(mockPrisma.submission.update).toHaveBeenCalled();
    const updateData = mockPrisma.submission.update.mock.calls[0]?.[0]?.data;
    expect(updateData?.status).toBe("eligibility_failed");
  });

  it("generates audit event for eligibility check", async () => {
    const submissionId = await createTestSubmission("test-elig-004");

    mockPrisma.eligibilityRecord.create.mockResolvedValue({
      id: "er-004",
      submissionId,
      status: "eligible",
      inputs: {},
    } as any);

    mockPrisma.submission.update.mockResolvedValue({
      id: submissionId,
      status: "eligible",
    } as any);

    mockPrisma.auditEvent.create.mockResolvedValue({
      id: "ae-elig-001",
      targetId: submissionId,
      targetType: "Submission",
      eventType: "eligibility.checked",
    } as any);

    await runEligibilityCheck({
      submissionId,
      inputs: {
        submittedInEnglish: true,
        alignedWithCall: true,
        primaryObjectiveIsRd: true,
        meetsEuropeanDimension: "true",
        requestedBudgetKEur: 50,
        firstTimeApplicantInProgramme: true,
      },
    });

    const auditCalls = mockPrisma.auditEvent.create.mock.calls;
    const eligAudit = auditCalls.find(
      (c) => c[0]?.data?.eventType === "eligibility.checked"
    );
    expect(eligAudit).toBeTruthy();
  });
});
