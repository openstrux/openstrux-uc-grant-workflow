// src/server/services/submissionService.ts

import type { Prisma } from "@prisma/client";
import type { IntakeRequest, IntakeResponse } from "../../domain/schemas";
import { prisma } from "../../lib/prisma";
import { createBlindedPacket } from "../../policies";

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
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    applicantAlias: r.applicantAlias,
    status: r.status,
    submittedAt: r.submittedAt ?? r.createdAt,
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

  const effective = row.proposalVersions[0] ?? null;
  return {
    id: row.id,
    applicantAlias: row.applicantAlias,
    status: row.status,
    submittedAt: row.submittedAt ?? row.createdAt,
    effectiveVersion: effective
      ? {
          title: effective.title,
          abstract: effective.abstract,
          requestedBudgetKEur: effective.requestedBudgetKEur,
          budgetUsage: effective.budgetUsage,
          tasksBreakdown: effective.tasksBreakdown,
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
 * Create a new submission with proposal version, applicant identity (if provided),
 * blinded packet, and audit event.
 */
export async function submitProposal(input: IntakeRequest): Promise<IntakeResult> {
  const submission = await prisma.submission.create({
    data: {
      callId: input.callId,
      applicantAlias: input.applicantAlias,
      status: "submitted",
      submittedAt: new Date(),
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

  const identityData = {
    id: "",
    submissionId: submission.id,
    legalName: input.legalName ?? "",
    email: input.email ?? "",
    country: input.country ?? "",
    organisation: input.organisation ?? "",
  };

  const pvForBlinding = {
    id: proposalVersion.id,
    submissionId: proposalVersion.submissionId,
    versionNumber: 1,
    isEffective: true,
    title: input.title,
    abstract: input.abstract,
    requestedBudgetKEur: input.requestedBudgetKEur,
    budgetUsage: input.budgetUsage,
    tasksBreakdown: input.tasksBreakdown,
  };

  const packet = createBlindedPacket(pvForBlinding, identityData);

  await prisma.blindedPacket.create({
    data: {
      proposalVersionId: packet.proposalVersionId,
      content: packet.content as unknown as Prisma.InputJsonValue,
    },
  });

  await prisma.auditEvent.create({
    data: {
      eventType: "submission.created",
      actorId: input.applicantAlias,
      targetType: "Submission",
      targetId: submission.id,
      payload: {
        callId: input.callId,
        applicantAlias: input.applicantAlias,
      } as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    submissionId: submission.id,
    status: submission.status,
  };
}
