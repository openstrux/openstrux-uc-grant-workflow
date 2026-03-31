/**
 * submissionService — proposal intake.
 */

import { type Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";
import { createBlindedPacket } from "../../policies";
import type { IntakeRequest, IntakeResponse } from "../../domain/schemas";

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
    submittedAt: row.submittedAt,
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
// Write operations
// ---------------------------------------------------------------------------

export interface IntakeResult extends IntakeResponse {
  status: string;
}

/**
 * Create a new submission with proposal version, blinded packet, and audit event.
 *
 * Uses sequential individual writes (not $transaction) for mock-test compatibility.
 * actorId defaults to "system" when not provided by the route handler.
 */
export async function submitProposal(
  input: IntakeRequest,
  actorId = "system",
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

  // 3. Create ApplicantIdentity if identity fields provided
  if (input.legalName || input.email || input.country || input.organisation || input.phoneNumber) {
    await prisma.applicantIdentity.create({
      data: {
        submissionId: submission.id,
        legalName: input.legalName ?? "",
        email: input.email ?? "",
        country: input.country ?? "",
        organisation: input.organisation ?? "",
        phoneNumber: input.phoneNumber,
      },
    });
  }

  // 4. Create BlindedPacket (identity-stripped)
  const blindedData = createBlindedPacket(
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
      proposalVersionId: blindedData.proposalVersionId,
      content: blindedData.content as Prisma.InputJsonValue,
    },
  });

  // 5. Create AuditEvent
  await prisma.auditEvent.create({
    data: {
      actorId,
      eventType: "submission.created",
      targetType: "Submission",
      targetId: submission.id,
      payload: {},
    },
  });

  return {
    submissionId: submission.id,
    status: submission.status,
  };
}
