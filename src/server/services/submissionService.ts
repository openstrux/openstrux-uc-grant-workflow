// src/server/services/submissionService.ts

import type { IntakeRequest, IntakeResponse } from "../../domain/schemas";
import { prisma } from "../../lib/prisma";
import { createBlindedPacket } from "../../policies";

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
    select: {
      id: true,
      applicantAlias: true,
      status: true,
      submittedAt: true,
    },
  });
  return rows.map((r) => ({ ...r, status: r.status as string }));
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

  const ev = row.proposalVersions[0] ?? null;
  return {
    id: row.id,
    applicantAlias: row.applicantAlias,
    status: row.status as string,
    submittedAt: row.submittedAt,
    effectiveVersion: ev
      ? {
          title: ev.title,
          abstract: ev.abstract,
          requestedBudgetKEur: ev.requestedBudgetKEur,
          budgetUsage: ev.budgetUsage,
          tasksBreakdown: ev.tasksBreakdown,
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
 */
export async function submitProposal(input: IntakeRequest): Promise<IntakeResult> {
  // 1. Create the Submission record
  const submission = await prisma.submission.create({
    data: {
      callId: input.callId,
      applicantAlias: input.applicantAlias,
      status: "submitted",
    },
  });

  // 2. Create the ProposalVersion
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

  // 3. Create ApplicantIdentity if any identity field was provided
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

  // 4. Build and store the blinded packet (identity-free)
  const pvData = {
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
    id: "identity-placeholder",
    submissionId: submission.id,
    legalName: input.legalName ?? "",
    email: input.email ?? "",
    country: input.country ?? "",
    organisation: input.organisation ?? "",
  };
  const packet = createBlindedPacket(pvData, identityData);

  await prisma.blindedPacket.create({
    data: {
      proposalVersionId: proposalVersion.id,
      content: JSON.parse(JSON.stringify(packet.content)),
    },
  });

  // 5. Emit audit event
  await prisma.auditEvent.create({
    data: {
      eventType: "submission.created",
      actorId: input.applicantAlias,
      targetType: "Submission",
      targetId: submission.id,
      payload: {},
      submissionId: submission.id,
    },
  });

  return {
    submissionId: submission.id,
    status: submission.status as string,
  };
}
