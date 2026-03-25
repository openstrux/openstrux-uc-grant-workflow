/**
 * submissionService — service-layer for proposal intake.
 *
 * Creates submission, proposal version, applicant identity (when provided),
 * blinded packet, and audit event.
 */

import { PrismaClient } from "@prisma/client";
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

export async function getSubmission(
  id: string,
): Promise<SubmissionDetail | null> {
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
// Write operations
// ---------------------------------------------------------------------------

export interface IntakeResult extends IntakeResponse {
  status: string;
}

/**
 * Create a new submission with proposal version, applicant identity (when
 * provided), blinded packet, and audit event.
 */
export async function submitProposal(
  input: IntakeRequest,
): Promise<IntakeResult> {
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

  // 3. Create ApplicantIdentity (only when identity fields are provided)
  const identityData =
    input.legalName && input.email && input.country && input.organisation
      ? {
          id: `ai-${submission.id}`,
          submissionId: submission.id,
          legalName: input.legalName,
          email: input.email,
          country: input.country,
          organisation: input.organisation,
        }
      : null;

  if (identityData) {
    await prisma.applicantIdentity.create({
      data: {
        submissionId: identityData.submissionId,
        legalName: identityData.legalName,
        email: identityData.email,
        country: identityData.country,
        organisation: identityData.organisation,
      },
    });
  }

  // 4. Create BlindedPacket
  const pvForBlinding = {
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

  const blindedPacketData = createBlindedPacket(pvForBlinding, {
    id: identityData?.id ?? "",
    submissionId: submission.id,
    legalName: identityData?.legalName ?? "",
    email: identityData?.email ?? "",
    country: identityData?.country ?? "",
    organisation: identityData?.organisation ?? "",
  });

  await prisma.blindedPacket.create({
    data: {
      proposalVersionId: proposalVersion.id,
      content: JSON.parse(JSON.stringify(blindedPacketData.content)) as object,
    },
  });

  // 5. Create AuditEvent
  await prisma.auditEvent.create({
    data: {
      eventType: "submission.created",
      actorId: input.applicantAlias,
      targetType: "Submission",
      targetId: submission.id,
      payload: JSON.parse(JSON.stringify({ callId: input.callId })) as object,
    },
  });

  return {
    submissionId: submission.id,
    status: "submitted",
  };
}
