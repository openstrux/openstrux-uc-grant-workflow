// src/server/services/submissionService.ts

import { PrismaClient, Prisma } from "@prisma/client";
import type { IntakeRequest, IntakeResponse } from "../../domain/schemas";
import { createBlindedPacket } from "../../policies";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

export interface SubmissionSummary {
  id: string;
  applicantAlias: string;
  status: string;
  submittedAt: Date;
}

export interface SubmissionDetail extends SubmissionSummary {
  effectiveVersion: {
    title: string;
    abstract: string;
    requestedBudgetKEur: number;
    budgetUsage: string;
    tasksBreakdown: string;
  } | null;
}

export async function listSubmissions(): Promise<SubmissionSummary[]> {
  const rows = await prisma.submission.findMany({
    orderBy: { submittedAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    applicantAlias: r.applicantAlias,
    status: r.status,
    submittedAt: r.submittedAt,
  }));
}

export async function getSubmission(id: string): Promise<SubmissionDetail | null> {
  const row = await prisma.submission.findUnique({
    where: { id },
    include: {
      proposalVersions: {
        where: { isEffective: true },
        take: 1,
      },
    },
  });
  if (!row) return null;
  const v = row.proposalVersions[0] ?? null;
  return {
    id: row.id,
    applicantAlias: row.applicantAlias,
    status: row.status,
    submittedAt: row.submittedAt,
    effectiveVersion: v
      ? {
          title: v.title,
          abstract: v.abstract,
          requestedBudgetKEur: v.requestedBudgetKEur,
          budgetUsage: v.budgetUsage,
          tasksBreakdown: v.tasksBreakdown,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

export interface IntakeResult extends IntakeResponse {
  status: string;
}

/**
 * Create a new submission with proposal version, applicant identity (if provided),
 * blinded packet, and audit event.
 *
 * Note: operations are sequential to support mock-based testing. In production
 * with a real database these run within a single request context.
 */
export async function submitProposal(input: IntakeRequest): Promise<IntakeResult> {
  const submission = await prisma.submission.create({
    data: {
      callId: input.callId,
      applicantAlias: input.applicantAlias,
      status: "submitted",
    },
  });

  const proposalVersion = await prisma.proposalVersion.create({
    data: {
      submissionId: submission.id,
      versionNumber: 1,
      isEffective: true,
      title: input.title,
      abstract: input.abstract,
      requestedBudgetKEur: input.requestedBudgetKEur,
      budgetUsage: input.budgetUsage,
      tasksBreakdown: input.tasksBreakdown,
    },
  });

  // Store applicant identity if provided
  const identityData = {
    id: `ai-${submission.id}`,
    submissionId: submission.id,
    legalName: input.legalName ?? "",
    email: input.email ?? "",
    country: input.country ?? "",
    organisation: input.organisation ?? "",
  };

  if (input.legalName || input.email || input.country || input.organisation) {
    await prisma.applicantIdentity.create({
      data: {
        submissionId: submission.id,
        legalName: input.legalName ?? "",
        email: input.email ?? "",
        country: input.country ?? "",
        organisation: input.organisation ?? "",
      },
    });
  }

  // Build a ProposalVersion-compatible object for createBlindedPacket
  const pvForBlind = {
    id: proposalVersion.id,
    submissionId: submission.id,
    versionNumber: 1,
    isEffective: true,
    title: input.title,
    abstract: input.abstract,
    requestedBudgetKEur: input.requestedBudgetKEur,
    budgetUsage: input.budgetUsage,
    tasksBreakdown: input.tasksBreakdown,
  };

  const packet = createBlindedPacket(pvForBlind, identityData);

  await prisma.blindedPacket.create({
    data: {
      proposalVersionId: proposalVersion.id,
      content: packet.content as Prisma.InputJsonValue,
    },
  });

  await prisma.auditEvent.create({
    data: {
      eventType: "submission.created",
      actorId: input.applicantAlias,
      targetType: "Submission",
      targetId: submission.id,
      payload: { callId: input.callId } as Prisma.InputJsonValue,
    },
  });

  return {
    submissionId: submission.id,
    status: submission.status,
  };
}
