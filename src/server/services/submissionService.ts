// src/server/services/submissionService.ts

import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { createBlindedPacket } from "../../policies";
import type { IntakeRequest, IntakeResponse } from "../../domain/schemas";

// ---------------------------------------------------------------------------
// Read operations (used by server components / admin pages)
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
    select: {
      id: true,
      applicantAlias: true,
      status: true,
      submittedAt: true,
    },
  });
  return rows;
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

  const effectiveVersion = row.proposalVersions[0] ?? null;

  return {
    id: row.id,
    applicantAlias: row.applicantAlias,
    status: row.status,
    submittedAt: row.submittedAt,
    effectiveVersion: effectiveVersion
      ? {
          title: effectiveVersion.title,
          abstract: effectiveVersion.abstract,
          requestedBudgetKEur: effectiveVersion.requestedBudgetKEur,
          budgetUsage: effectiveVersion.budgetUsage,
          tasksBreakdown: effectiveVersion.tasksBreakdown,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Write operations (used by route handlers)
// ---------------------------------------------------------------------------

export interface IntakeResult extends IntakeResponse {
  status: string;
}

/**
 * Create a new submission with proposal version, (optionally) applicant identity,
 * blinded packet, and audit event.
 */
export async function submitProposal(input: IntakeRequest): Promise<IntakeResult> {
  // 1. Create Submission
  const submission = await prisma.submission.create({
    data: {
      callId: input.callId,
      applicantAlias: input.applicantAlias,
      status: "submitted",
    },
  });

  // 2. Create ProposalVersion
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

  // 3. Optionally create ApplicantIdentity
  if (input.legalName && input.email && input.country && input.organisation) {
    await prisma.applicantIdentity.create({
      data: {
        submissionId: submission.id,
        legalName: input.legalName,
        email: input.email,
        country: input.country,
        organisation: input.organisation,
      },
    });
  }

  // 4. Create BlindedPacket (identity-stripped)
  const blindedData = createBlindedPacket(
    {
      id: proposalVersion.id,
      submissionId: proposalVersion.submissionId,
      versionNumber: proposalVersion.versionNumber,
      isEffective: proposalVersion.isEffective,
      title: proposalVersion.title,
      abstract: proposalVersion.abstract,
      requestedBudgetKEur: proposalVersion.requestedBudgetKEur,
      budgetUsage: proposalVersion.budgetUsage,
      tasksBreakdown: proposalVersion.tasksBreakdown,
    },
    {
      id: "",
      submissionId: submission.id,
      legalName: input.legalName ?? "",
      email: input.email ?? "",
      country: input.country ?? "",
      organisation: input.organisation ?? "",
    },
  );

  await prisma.blindedPacket.create({
    data: {
      proposalVersionId: blindedData.proposalVersionId,
      content: blindedData.content as Prisma.InputJsonValue,
    },
  });

  // 5. Create AuditEvent
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
