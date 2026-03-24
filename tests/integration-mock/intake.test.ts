/**
 * Mock-based integration tests for the intake service.
 *
 * Uses vitest-mock-extended to intercept PrismaClient calls — no database required.
 * These tests run during agentic generation (CLAUDE.md: pnpm test:integration:mock).
 *
 * Assertions verify return values and prisma call arguments, not persisted state.
 */

import { describe, it, expect } from "vitest";
import { mockPrisma } from "./setup";
import { submitProposal } from "../../app/web/src/server/services/submissionService";

describe("Intake service (mock)", () => {
  it("creates a submission with a proposal version", async () => {
    const submissionId = "test-submission-001";

    mockPrisma.submission.create.mockResolvedValue({
      id: submissionId,
      applicantAlias: "test-researcher-001",
      status: "submitted",
      callId: "call-test",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    mockPrisma.proposalVersion.create.mockResolvedValue({
      id: "pv-001",
      submissionId,
    } as any);

    mockPrisma.blindedPacket.create.mockResolvedValue({
      id: "bp-001",
      proposalVersionId: "pv-001",
      content: {},
    } as any);

    mockPrisma.auditEvent.create.mockResolvedValue({} as any);

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
    expect(mockPrisma.submission.create).toHaveBeenCalled();
  });

  it("creates a blinded packet without identity fields", async () => {
    const submissionId = "test-submission-002";

    mockPrisma.submission.create.mockResolvedValue({
      id: submissionId,
      applicantAlias: "test-researcher-002",
      status: "submitted",
      callId: "call-test",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    mockPrisma.proposalVersion.create.mockResolvedValue({
      id: "pv-002",
      submissionId,
    } as any);

    mockPrisma.blindedPacket.create.mockResolvedValue({
      id: "bp-002",
      proposalVersionId: "pv-002",
      content: { title: "Another Test Proposal" },
    } as any);

    mockPrisma.auditEvent.create.mockResolvedValue({} as any);

    await submitProposal({
      callId: "call-test",
      applicantAlias: "test-researcher-002",
      title: "Another Test Proposal",
      abstract: "Another test abstract.",
      requestedBudgetKEur: 75,
      budgetUsage: "Development and audit.",
      tasksBreakdown: "T1: Implementation — 2 months.",
    });

    expect(mockPrisma.blindedPacket.create).toHaveBeenCalled();
    const packetData = mockPrisma.blindedPacket.create.mock.calls[0]?.[0]?.data;
    const content = packetData?.content as Record<string, unknown> | undefined;
    expect(content).not.toHaveProperty("applicantIdentity");
    expect(content).not.toHaveProperty("legalName");
    expect(content).not.toHaveProperty("email");
  });

  it("generates an audit event on submission creation", async () => {
    const submissionId = "test-submission-003";

    mockPrisma.submission.create.mockResolvedValue({
      id: submissionId,
      applicantAlias: "test-researcher-003",
      status: "submitted",
      callId: "call-test",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    mockPrisma.proposalVersion.create.mockResolvedValue({
      id: "pv-003",
      submissionId,
    } as any);

    mockPrisma.blindedPacket.create.mockResolvedValue({
      id: "bp-003",
      proposalVersionId: "pv-003",
      content: {},
    } as any);

    mockPrisma.auditEvent.create.mockResolvedValue({
      id: "ae-001",
      targetId: submissionId,
      targetType: "Submission",
      eventType: "submission.created",
    } as any);

    await submitProposal({
      callId: "call-test",
      applicantAlias: "test-researcher-003",
      title: "Audit Test Proposal",
      abstract: "Audit test.",
      requestedBudgetKEur: 30,
      budgetUsage: "Development.",
      tasksBreakdown: "T1: Audit test.",
    });

    expect(mockPrisma.auditEvent.create).toHaveBeenCalled();
    const auditData = mockPrisma.auditEvent.create.mock.calls[0]?.[0]?.data;
    expect(auditData?.eventType).toBe("submission.created");
    expect(auditData?.targetType).toBe("Submission");
  });
});
