/**
 * Integration tests for the intake service.
 *
 * These tests require a running PostgreSQL instance.
 * Set DATABASE_URL in .env.test or environment before running.
 *
 * Tests the full stack: POST /api/intake -> service -> DB -> response.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

beforeAll(async () => {
  await prisma.$connect();
  // Clean up any test data from previous runs
  await prisma.submission.deleteMany({ where: { applicantAlias: { startsWith: "test-" } } });
});

afterAll(async () => {
  await prisma.submission.deleteMany({ where: { applicantAlias: { startsWith: "test-" } } });
  await prisma.$disconnect();
});

describe("Intake service (integration)", () => {
  it("creates a submission with a proposal version", async () => {
    // Import the service function from the generated backend
    // This will fail at compile time if the backend hasn't been generated yet.
    const { submitProposal } = await import("../../packages/policies/src/workflow/submitProposal");

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

    // Verify the submission was persisted
    const stored = await prisma.submission.findUnique({ where: { id: result.submissionId } });
    expect(stored).toBeTruthy();
    expect(stored?.applicantAlias).toBe("test-researcher-001");
    expect(stored?.status).toBe("submitted");
  });

  it("creates a blinded packet for the effective proposal version", async () => {
    const { submitProposal } = await import("../../packages/policies/src/workflow/submitProposal");

    const result = await submitProposal({
      callId: "call-test",
      applicantAlias: "test-researcher-002",
      title: "Another Test Proposal",
      abstract: "Another test abstract.",
      requestedBudgetKEur: 75,
      budgetUsage: "Development and audit.",
      tasksBreakdown: "T1: Implementation — 2 months.",
    });

    // Blinded packet must be created automatically
    const packet = await prisma.blindedPacket.findFirst({
      where: { proposalVersion: { submissionId: result.submissionId } },
    });

    expect(packet).toBeTruthy();
    // Identity fields must not be in the packet content
    const content = packet!.content as Record<string, unknown>;
    expect(content).not.toHaveProperty("applicantIdentity");
    expect(content).not.toHaveProperty("legalName");
    expect(content).not.toHaveProperty("email");
  });

  it("generates an audit event on submission creation", async () => {
    const { submitProposal } = await import("../../packages/policies/src/workflow/submitProposal");

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
