/**
 * /admin/proposals/[id] — Proposal detail view.
 *
 * Shows the effective proposal version content (pseudonymized for review),
 * current status, and available actions.
 */

import Link from "next/link";
import { getSubmission } from "@/server/services/submissionService";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

function statusBadgeClass(status: string): string {
  if (status === "eligible") return "badge badge-eligible";
  if (status === "eligibility_failed") return "badge badge-ineligible";
  return "badge badge-pending";
}

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const submission = await getSubmission(id);
  if (!submission) notFound();

  return (
    <main>
      <Link href="/admin" className="link-back">
        <ArrowLeft size={14} />
        Back to admin
      </Link>

      <h1>{submission.effectiveVersion?.title ?? "(no version)"}</h1>

      <p>
        <strong>Status:</strong>{" "}
        <span className={statusBadgeClass(submission.status)}>{submission.status}</span>
      </p>
      <p>
        <strong>Submitted:</strong> {new Date(submission.submittedAt).toLocaleString()}
      </p>

      {submission.effectiveVersion && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <h2 style={{ marginTop: 0 }}>Proposal content</h2>
          <p>
            <strong>Abstract:</strong>
          </p>
          <p>{submission.effectiveVersion.abstract}</p>
          <p>
            <strong>Budget:</strong> {submission.effectiveVersion.requestedBudgetKEur}k EUR
          </p>
          {submission.effectiveVersion.budgetUsage && (
            <>
              <p>
                <strong>Budget usage:</strong>
              </p>
              <p>{submission.effectiveVersion.budgetUsage}</p>
            </>
          )}
          {submission.effectiveVersion.tasksBreakdown && (
            <>
              <p>
                <strong>Tasks breakdown:</strong>
              </p>
              <pre>{submission.effectiveVersion.tasksBreakdown}</pre>
            </>
          )}
        </div>
      )}

      <div className="actions-row">
        <Link href={`/admin/proposals/${id}/eligibility`}>
          <button>
            <ShieldCheck size={16} />
            Run eligibility check
          </button>
        </Link>
      </div>
    </main>
  );
}
