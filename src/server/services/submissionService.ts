// src/server/services/submissionService.ts
/**
 * submissionService — proposal intake and retrieval.
 *
 * Orchestrates: Submission → ProposalVersion → ApplicantIdentity (when
 * provided) → BlindedPacket → AuditEvent.
 */

import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import {
  createBlindedPacket,
  type ApplicantIdentityData,
} from "../../policies";
import type {
  IntakeRequest,
  IntakeResponse,
  ProposalVersion,
} from "../../domain/schemas";

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
  return rows.map((s) => ({
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
        orderBy: { versionNumber: "desc" },
      },
    },
  });
  if (!submission) return null;

  const effective = submission.proposalVersions[0] ?? null;
  return {
    id: submission.id,
    applicantAlias: submission.applicantAlias,
    status: submission.status,
    submittedAt: submission.submittedAt,
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
 * Create a new submission with proposal version, (optionally) applicant
 * identity, blinded packet, and audit event.
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

  // 2. Create ProposalVersion (v1, effective)
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

  // 3. Create ApplicantIdentity (when identity fields are provided)
  if (input.legalName ?? input.email) {
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

  // 4. Build blinded packet (identity-free copy of proposal content)
  const pvForBlinding: ProposalVersion = {
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

  const identityForBlinding: ApplicantIdentityData = {
    id: "",
    submissionId: submission.id,
    legalName: input.legalName ?? "",
    email: input.email ?? "",
    country: input.country ?? "",
    organisation: input.organisation ?? "",
  };

  const blindedPacketData = createBlindedPacket(pvForBlinding, identityForBlinding);

  await prisma.blindedPacket.create({
    data: {
      proposalVersionId: proposalVersion.id,
      content: blindedPacketData.content as unknown as Prisma.InputJsonValue,
    },
  });

  // 5. Audit event
  await prisma.auditEvent.create({
    data: {
      eventType: "submission.created",
      actorId: "system",
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
