/**
 * submissionService — service-layer implementation for proposal intake.
 *
 * All operations that touch multiple models run sequentially (mock-test compatible).
 * Each state-changing operation produces an AuditEvent.
 */

import type { IntakeRequest, IntakeResponse } from "../../domain/schemas";
import { prisma } from "../../lib/prisma";
import { createBlindedPacket } from "../../policies";
import type { ApplicantIdentityData } from "../../policies";

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
 * Create a new submission with proposal version, blinded packet, and audit event.
 * Applicant identity is stored separately when identity fields are provided.
 * Operations are sequential to maintain compatibility with vitest-mock-extended.
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

  // 2. Create proposal version (evaluable content, identity-free)
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

  // 3. Persist applicant identity separately (restricted access path)
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

  // 4. Generate blinded packet (identity stripped — reviewer-safe)
  const identityForBlinding: ApplicantIdentityData = {
    id: "",
    submissionId: submission.id,
    legalName: input.legalName ?? "",
    email: input.email ?? "",
    country: input.country ?? "",
    organisation: input.organisation ?? "",
  };
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
  const blindedPacketData = createBlindedPacket(pvData, identityForBlinding);

  await prisma.blindedPacket.create({
    data: {
      proposalVersionId: proposalVersion.id,
      content: blindedPacketData.content as Parameters<
        typeof prisma.blindedPacket.create
      >[0]["data"]["content"],
    },
  });

  // 5. Audit event
  await prisma.auditEvent.create({
    data: {
      eventType: "submission.created",
      actorId: input.applicantAlias,
      targetType: "Submission",
      targetId: submission.id,
      payload: {} as Parameters<typeof prisma.auditEvent.create>[0]["data"]["payload"],
    },
  });

  return { submissionId: submission.id, status: submission.status };
}
