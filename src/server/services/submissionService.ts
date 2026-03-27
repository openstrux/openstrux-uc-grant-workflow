/**
 * submissionService — service-layer for proposal intake.
 */

import { prisma } from "../../lib/prisma";
import { createBlindedPacket } from "../../policies";
import type { IntakeRequest } from "../../domain/schemas";
import type { Prisma } from "@prisma/client";

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
    orderBy: { createdAt: "desc" },
  });
  return rows.map((s) => ({
    id: s.id,
    applicantAlias: s.applicantAlias,
    status: s.status,
    submittedAt: s.submittedAt ?? s.createdAt,
  }));
}

export async function getSubmission(id: string): Promise<SubmissionDetail | null> {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      versions: {
        where: { isEffective: true },
        take: 1,
      },
    },
  });
  if (!submission) return null;

  const effectiveVersion = submission.versions[0] ?? null;

  return {
    id: submission.id,
    applicantAlias: submission.applicantAlias,
    status: submission.status,
    submittedAt: submission.submittedAt ?? submission.createdAt,
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
// Write operations
// ---------------------------------------------------------------------------

export interface IntakeResult {
  submissionId: string;
  status: string;
}

/**
 * Create a new submission with proposal version, blinded packet, and audit event.
 * If identity fields are provided, also creates ApplicantIdentity.
 */
export async function submitProposal(input: IntakeRequest): Promise<IntakeResult> {
  // 1. Create submission
  const submission = await prisma.submission.create({
    data: {
      callId: input.callId,
      applicantAlias: input.applicantAlias,
      status: "submitted",
      submittedAt: new Date(),
    },
  });

  // 2. Create proposal version
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

  // 3. Create applicant identity if provided (stored separately)
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

  // 4. Create blinded packet (identity stripped)
  const pv = {
    id: proposalVersion.id,
    submissionId: submission.id,
    versionNumber: proposalVersion.versionNumber,
    isEffective: proposalVersion.isEffective,
    title: proposalVersion.title,
    abstract: proposalVersion.abstract,
    requestedBudgetKEur: proposalVersion.requestedBudgetKEur,
    budgetUsage: proposalVersion.budgetUsage,
    tasksBreakdown: proposalVersion.tasksBreakdown,
  };

  const placeholderIdentity = {
    id: "",
    submissionId: submission.id,
    legalName: input.legalName ?? "",
    email: input.email ?? "",
    country: input.country ?? "",
    organisation: input.organisation ?? "",
  };

  const blindedPacketData = createBlindedPacket(pv, placeholderIdentity);

  await prisma.blindedPacket.create({
    data: {
      proposalVersionId: blindedPacketData.proposalVersionId,
      content: blindedPacketData.content as unknown as Prisma.InputJsonValue,
    },
  });

  // 5. Create audit event
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
      timestamp: new Date(),
    },
  });

  return {
    submissionId: submission.id,
    status: submission.status,
  };
}
