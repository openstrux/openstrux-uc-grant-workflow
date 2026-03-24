/**
 * submissionService — service-layer contract for proposal intake.
 *
 * Called by route handlers and server components.
 * All types derive from @grant-workflow/domain schemas.
 *
 * @generated-stub — replace with real implementation via backend generation
 */

import type { IntakeRequest, IntakeResponse } from "../../../../../packages/domain/src/schemas";

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
  // TODO: implement in backend generation phase
  return [];
}

export async function getSubmission(id: string): Promise<SubmissionDetail | null> {
  // TODO: implement in backend generation phase
  void id;
  return null;
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
export async function submitProposal(_input: IntakeRequest): Promise<IntakeResult> {
  throw new Error("Not implemented — replace via backend generation");
}
