/**
 * Integration tests for the eligibility service.
 *
 * Tests the full stack: runEligibilityCheck service → DB → verify persisted state.
 * Requires a running PostgreSQL instance (DATABASE_URL).
 *
 * Imports from service-layer contracts, not internal modules.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { submitProposal } from "../../src/server/services/submissionService";
import { runEligibilityCheck } from "../../src/server/services/eligibilityService";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

beforeAll(async () => {
  await prisma.$connect();
  await prisma.eligibilityRecord.deleteMany({
    where: { submission: { applicantAlias: { startsWith: "test-elig-" } } },
  });
  await prisma.submission.deleteMany({ where: { applicantAlias: { startsWith: "test-elig-" } } });
});

afterAll(async () => {
  await prisma.eligibilityRecord.deleteMany({
    where: { submission: { applicantAlias: { startsWith: "test-elig-" } } },
  });
  await prisma.submission.deleteMany({ where: { applicantAlias: { startsWith: "test-elig-" } } });
  await prisma.$disconnect();
});

async function createTestSubmission(alias: string): Promise<string> {
  const result = await submitProposal({
    callId: "eu-oss-fund-2026",
    applicantAlias: alias,
    title: "Eligibility Test Proposal",
    abstract: "For eligibility testing.",
    requestedBudgetKEur: 50,
    budgetUsage: "Development.",
    tasksBreakdown: "T1: Eligibility test.",
  });
  return result.submissionId;
}

describe("Eligibility service (integration)", () => {
  it("records eligibility check result in the database", async () => {
    const submissionId = await createTestSubmission("test-elig-001");

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

    const record = await prisma.eligibilityRecord.findFirst({ where: { submissionId } });
    expect(record).toBeTruthy();
    expect(record?.status).toBe("eligible");
    expect(record?.inputs).toBeTruthy();
  });

  it("updates submission status to eligible on pass", async () => {
    const submissionId = await createTestSubmission("test-elig-002");

    await runEligibilityCheck({
      submissionId,
      inputs: {
        submittedInEnglish: true,
        alignedWithCall: true,
        primaryObjectiveIsRd: true,
        meetsEuropeanDimension: "not_applicable",
        requestedBudgetKEur: 50,
        firstTimeApplicantInProgramme: false,
      },
    });

    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
    expect(submission?.status).toBe("eligible");
  });

  it("updates submission status to eligibility_failed on fail", async () => {
    const submissionId = await createTestSubmission("test-elig-003");

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

    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
    expect(submission?.status).toBe("eligibility_failed");
  });

  it("generates audit event for eligibility check", async () => {
    const submissionId = await createTestSubmission("test-elig-004");

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

    const events = await prisma.auditEvent.findMany({
      where: { targetId: submissionId, eventType: "eligibility.checked" },
    });
    expect(events.length).toBeGreaterThan(0);
  });
});
