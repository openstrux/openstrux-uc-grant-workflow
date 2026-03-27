// src/server/services/submissionService.ts
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
  const submissions = await prisma.submission.findMany({
    orderBy: { submittedAt: "desc" },
  });
  return submissions.map((s) => ({
    id: s.id,
    applicantAlias: s.applicantAlias,
    status: s.status,
    submittedAt: s.submittedAt,
  }));
}

export async function getSubmission(
  id: string,
): Promise<SubmissionDetail | null> {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      proposalVersions: {
        where: { isEffective: true },
        take: 1,
      },
    },
  });

  if (!submission) return null;

  const effectiveVersion = submission.proposalVersions[0] ?? null;

  return {
    id: submission.id,
    applicantAlias: submission.applicantAlias,
    status: submission.status,
    submittedAt: submission.submittedAt,
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
 * Create a new submission with proposal version, applicant identity (if provided),
 * blinded packet, and audit event — all in sequence.
 */
export async function submitProposal(input: IntakeRequest): Promise<IntakeResult> {
  // 1. Create submission
  const submission = await prisma.submission.create({
    data: {
      callId: input.callId,
      applicantAlias: input.applicantAlias,
      status: "submitted",
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

  // 3. Create applicant identity (stored separately, if provided)
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

  // 4. Create blinded packet (identity-stripped)
  const proposalVersionForPolicy = {
    id: proposalVersion.id,
    submissionId: proposalVersion.submissionId,
    versionNumber: proposalVersion.versionNumber,
    isEffective: proposalVersion.isEffective,
    title: proposalVersion.title,
    abstract: proposalVersion.abstract,
    requestedBudgetKEur: proposalVersion.requestedBudgetKEur,
    budgetUsage: proposalVersion.budgetUsage,
    tasksBreakdown: proposalVersion.tasksBreakdown,
  };

  const blindedData = createBlindedPacket(proposalVersionForPolicy, {
    id: "",
    submissionId: submission.id,
    legalName: input.legalName ?? "",
    email: input.email ?? "",
    country: input.country ?? "",
    organisation: input.organisation ?? "",
  });

  await prisma.blindedPacket.create({
    data: {
      proposalVersionId: proposalVersion.id,
      content: JSON.parse(JSON.stringify(blindedData.content)),
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
      },
    },
  });

  return {
    submissionId: submission.id,
    status: submission.status,
  };
}
