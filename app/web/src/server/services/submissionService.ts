/**
 * submissionService — interface contract for the backend.
 *
 * Both generation paths must implement these functions.
 * The frontend calls them via Next.js server components and route handlers.
 *
 * @generated-stub — replace with real implementation via backend generation
 */

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
