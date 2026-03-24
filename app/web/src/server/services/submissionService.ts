/**
 * submissionService — service-layer contract for proposal intake.
 *
 * Called by route handlers and server components.
 * All types derive from @grant-workflow/domain schemas.
 */

import type { IntakeRequest, IntakeResponse } from "../../../../../packages/domain/src/schemas";
import { prisma } from "../../lib/prisma";
import {
  createBlindedPacket,
  type ApplicantIdentityData,
} from "../../../../../packages/policies/src";

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
    select: {
      id: true,
      applicantAlias: true,
      status: true,
      submittedAt: true,
    },
  });

  return submissions;
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
 * Create a new submission with proposal version, applicant identity,
 * blinded packet, and audit event — all in a single transaction.
 */
export async function submitProposal(input: IntakeRequest): Promise<IntakeResult> {
  const result = await prisma.$transaction(async (tx) => {
    // Create the submission
    const submission = await tx.submission.create({
      data: {
        callId: input.callId,
        applicantAlias: input.applicantAlias,
        status: "submitted",
      },
    });

    // Create the initial proposal version (version 1, effective)
    const proposalVersion = await tx.proposalVersion.create({
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

    // Create applicant identity record (identity data separated from content)
    const applicantIdentity = await tx.applicantIdentity.create({
      data: {
        submissionId: submission.id,
        legalName: "",
        email: "",
        country: "",
        organisation: "",
      },
    });

    // Build identity data for blinded packet creation
    const identityData: ApplicantIdentityData = {
      id: applicantIdentity.id,
      submissionId: applicantIdentity.submissionId,
      legalName: applicantIdentity.legalName,
      email: applicantIdentity.email,
      country: applicantIdentity.country,
      organisation: applicantIdentity.organisation,
    };

    // Create blinded packet (identity-stripped)
    const blindedPacketData = createBlindedPacket(
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
      identityData,
    );

    await tx.blindedPacket.create({
      data: {
        proposalVersionId: blindedPacketData.proposalVersionId,
        content: blindedPacketData.content as object,
      },
    });

    // Create audit event
    await tx.auditEvent.create({
      data: {
        eventType: "submission.created",
        actorId: input.applicantAlias,
        targetType: "Submission",
        targetId: submission.id,
        payload: {
          callId: input.callId,
          title: input.title,
        },
      },
    });

    return submission;
  });

  return {
    submissionId: result.id,
    status: result.status,
  };
}
