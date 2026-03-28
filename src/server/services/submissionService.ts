/**
 * submissionService — proposal intake implementation.
 *
 * Called by route handlers and server components.
 * All types derive from @grant-workflow/domain schemas.
 */

import { prisma } from "../../lib/prisma";
import { createBlindedPacket } from "../../policies";
import type { IntakeRequest, IntakeResponse } from "../../domain/schemas";
import type { InputJsonValue } from "@prisma/client/runtime/library";

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
    orderBy: { createdAt: "desc" },
  });
  return submissions.map((s) => ({
    id: s.id,
    applicantAlias: s.applicantAlias,
    status: s.status,
    submittedAt: s.submittedAt,
  }));
}

export async function getSubmission(id: string): Promise<SubmissionDetail | null> {
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
 * blinded packet, and audit event.
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

  // 3. Build blinded packet from input fields (not DB return — mock returns partial)
  const fullProposalVersion = {
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

  const identityData = {
    id: "",
    submissionId: submission.id,
    legalName: input.legalName ?? "",
    email: input.email ?? "",
    country: input.country ?? "",
    organisation: input.organisation ?? "",
  };

  const packet = createBlindedPacket(fullProposalVersion, identityData);

  await prisma.blindedPacket.create({
    data: {
      proposalVersionId: proposalVersion.id,
      content: packet.content as unknown as InputJsonValue,
    },
  });

  // 4. Audit event
  await prisma.auditEvent.create({
    data: {
      eventType: "submission.created",
      actorId: input.applicantAlias,
      targetType: "Submission",
      targetId: submission.id,
      payload: {} as unknown as InputJsonValue,
    },
  });

  // 5. Store applicant identity if any identity fields are provided
  if (input.legalName ?? input.email ?? input.country ?? input.organisation) {
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

  return {
    submissionId: submission.id,
    status: submission.status,
  };
}
