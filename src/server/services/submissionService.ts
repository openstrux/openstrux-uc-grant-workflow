/**
 * submissionService — service-layer for proposal intake.
 *
 * Creates submissions, proposal versions, blinded packets, and audit events.
 */

import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type { IntakeRequest, IntakeResponse } from "../../domain/schemas/index";
import { createBlindedPacket } from "../../policies/index";

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
// Write operations
// ---------------------------------------------------------------------------

export interface IntakeResult extends IntakeResponse {
  status: string;
}

/**
 * Create a new submission with proposal version, blinded packet, and audit event.
 * Applicant identity is stored separately if provided.
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

  // Create blinded packet (identity-stripped)
  const packetData = createBlindedPacket(
    {
      id: proposalVersion.id,
      submissionId: submission.id,
      versionNumber: 1,
      isEffective: true,
      title: input.title,
      abstract: input.abstract,
      requestedBudgetKEur: input.requestedBudgetKEur,
      budgetUsage: input.budgetUsage,
      tasksBreakdown: input.tasksBreakdown,
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
      proposalVersionId: proposalVersion.id,
      content: packetData.content as unknown as Prisma.InputJsonValue,
    },
  });

  // Store applicant identity if provided
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

  // Audit event
  await prisma.auditEvent.create({
    data: {
      eventType: "submission.created",
      actorId: input.applicantAlias,
      targetType: "Submission",
      targetId: submission.id,
      payload: { callId: input.callId },
    },
  });

  return {
    submissionId: submission.id,
    status: submission.status,
  };
}
