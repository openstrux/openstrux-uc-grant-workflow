/**
 * submissionService — service-layer implementation for proposal intake.
 *
 * Called by route handlers and server components.
 * All types derive from @grant-workflow/domain schemas.
 */

import type { IntakeRequest, IntakeResponse } from "../../domain/schemas";
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { createBlindedPacket } from "../../policies";
import type { ApplicantIdentityData } from "../../policies";

const prisma = new PrismaClient();

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

  const version = submission.versions[0] ?? null;
  return {
    id: submission.id,
    applicantAlias: submission.applicantAlias,
    status: submission.status,
    submittedAt: submission.submittedAt,
    effectiveVersion: version
      ? {
          title: version.title,
          abstract: version.abstract,
          requestedBudgetKEur: version.requestedBudgetKEur,
          budgetUsage: version.budgetUsage,
          tasksBreakdown: version.tasksBreakdown,
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
  // Create submission
  const submission = await prisma.submission.create({
    data: {
      callId: input.callId,
      applicantAlias: input.applicantAlias,
      status: "submitted",
    },
  });

  // Create proposal version
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

  // Create applicant identity if provided
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

  // Build proposal version object for blinded packet creation
  const proposalVersionData = {
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

  // Build identity data (use placeholders if not provided)
  const identityData: ApplicantIdentityData = {
    id: "",
    submissionId: submission.id,
    legalName: input.legalName ?? "",
    email: input.email ?? "",
    country: input.country ?? "",
    organisation: input.organisation ?? "",
  };

  // Create blinded packet
  const packetData = createBlindedPacket(proposalVersionData, identityData);
  await prisma.blindedPacket.create({
    data: {
      proposalVersionId: proposalVersion.id,
      content: packetData.content as unknown as Prisma.InputJsonValue,
    },
  });

  // Create audit event
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
