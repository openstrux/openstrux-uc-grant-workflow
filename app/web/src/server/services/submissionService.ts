/**
 * submissionService — service-layer contract for proposal intake.
 *
 * Called by route handlers and server components.
 * All types derive from @grant-workflow/domain schemas.
 */

import { PrismaClient } from "@prisma/client";
import type { IntakeRequest, IntakeResponse } from "../../../../../packages/domain/src/schemas";
import {
  createBlindedPacket,
  type ApplicantIdentityData,
} from "../../../../../packages/policies/src";

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

  const pv = row.proposalVersions[0] ?? null;

  return {
    id: row.id,
    applicantAlias: row.applicantAlias,
    status: row.status,
    submittedAt: row.submittedAt,
    effectiveVersion: pv
      ? {
          title: pv.title,
          abstract: pv.abstract,
          requestedBudgetKEur: pv.requestedBudgetKEur,
          budgetUsage: pv.budgetUsage,
          tasksBreakdown: pv.tasksBreakdown,
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
 * Create a new submission with proposal version, blinded packet, and audit
 * event — all in a single Prisma transaction.
 *
 * ApplicantIdentity is created with a placeholder record; identity fields
 * (legalName, email, country, organisation) are collected via a separate
 * identity workflow and are nullable at intake time.
 */
export async function submitProposal(input: IntakeRequest): Promise<IntakeResult> {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create the Submission
    const submission = await tx.submission.create({
      data: {
        callId: input.callId,
        applicantAlias: input.applicantAlias,
        status: "submitted",
      },
    });

    // 2. Create the ProposalVersion (v1, effective)
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

    // 3. Create a placeholder ApplicantIdentity record (identity fields
    //    are nullable — filled via a separate identity collection step)
    const identity = await tx.applicantIdentity.create({
      data: {
        submissionId: submission.id,
      },
    });

    // 4. Build the blinded packet (identity-stripped)
    const identityData: ApplicantIdentityData = {
      id: identity.id,
      submissionId: identity.submissionId,
      legalName: identity.legalName ?? "",
      email: identity.email ?? "",
      country: identity.country ?? "",
      organisation: identity.organisation ?? "",
    };

    const domainProposalVersion = {
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

    const blindedPacketData = createBlindedPacket(domainProposalVersion, identityData);

    await tx.blindedPacket.create({
      data: {
        proposalVersionId: blindedPacketData.proposalVersionId,
        content: blindedPacketData.content,
      },
    });

    // 5. Emit audit event
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
