/**
 * Integration tests for the intake service.
 *
 * Tests the full stack: submitProposal service → DB → verify persisted state.
 * Requires a running PostgreSQL instance (DATABASE_URL).
 *
 * Imports from the service-layer contract, not internal modules.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { submitProposal } from "../../app/web/src/server/services/submissionService";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

beforeAll(async () => {
  await prisma.$connect();
  await prisma.submission.deleteMany({ where: { applicantAlias: { startsWith: "test-" } } });
});

afterAll(async () => {
  await prisma.submission.deleteMany({ where: { applicantAlias: { startsWith: "test-" } } });
  await prisma.$disconnect();
});

describe("Intake service (integration)", () => {
  it("creates a submission with a proposal version", async () => {
    const result = await submitProposal({
      callId: "call-test",
      applicantAlias: "test-researcher-001",
      title: "Test Proposal",
      abstract: "A test abstract.",
      requestedBudgetKEur: 50,
      budgetUsage: "Development.",
      tasksBreakdown: "T1: Test implementation.",
    });

    expect(result.submissionId).toBeTruthy();
    expect(result.status).toBe("submitted");

    const stored = await prisma.submission.findUnique({ where: { id: result.submissionId } });
    expect(stored).toBeTruthy();
    expect(stored?.applicantAlias).toBe("test-researcher-001");
    expect(stored?.status).toBe("submitted");
  });

  it("creates a blinded packet for the effective proposal version", async () => {
    const result = await submitProposal({
      callId: "call-test",
      applicantAlias: "test-researcher-002",
      title: "Another Test Proposal",
      abstract: "Another test abstract.",
      requestedBudgetKEur: 75,
      budgetUsage: "Development and audit.",
      tasksBreakdown: "T1: Implementation — 2 months.",
    });

    const packet = await prisma.blindedPacket.findFirst({
      where: { proposalVersion: { submissionId: result.submissionId } },
    });

    expect(packet).toBeTruthy();
    const content = packet!.content as Record<string, unknown>;
    expect(content).not.toHaveProperty("applicantIdentity");
    expect(content).not.toHaveProperty("legalName");
    expect(content).not.toHaveProperty("email");
  });

  it("generates an audit event on submission creation", async () => {
    const result = await submitProposal({
      callId: "call-test",
      applicantAlias: "test-researcher-003",
      title: "Audit Test Proposal",
      abstract: "Audit test.",
      requestedBudgetKEur: 30,
      budgetUsage: "Development.",
      tasksBreakdown: "T1: Audit test.",
    });

    const events = await prisma.auditEvent.findMany({
      where: { targetId: result.submissionId, targetType: "Submission" },
    });

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].eventType).toBe("submission.created");
  });
});
