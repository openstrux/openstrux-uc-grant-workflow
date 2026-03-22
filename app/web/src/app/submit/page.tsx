/**
 * /submit — Proposal submission form.
 *
 * Captures: call selection, applicant alias, title, abstract, budget,
 * budget usage explanation, and tasks breakdown. Posts to /api/intake.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

export default function SubmitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const body = {
      callId: form.get("callId") as string,
      applicantAlias: form.get("applicantAlias") as string,
      title: form.get("title") as string,
      abstract: form.get("abstract") as string,
      requestedBudgetKEur: Number(form.get("requestedBudgetKEur")),
      budgetUsage: form.get("budgetUsage") as string,
      tasksBreakdown: form.get("tasksBreakdown") as string,
    };

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const { submissionId } = (await res.json()) as { submissionId: string };
      router.push(`/admin/proposals/${submissionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Submit Proposal</h1>
      <p>All fields are required. Your identity is stored separately and never shown to reviewers.</p>

      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label htmlFor="callId">Funding call</label>
          <select id="callId" name="callId" required>
            <option value="">Select a call…</option>
            <option value="eu-oss-fund-2026">EU Open Source Fund 2026</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="applicantAlias">Applicant alias (pseudonym)</label>
          <input
            id="applicantAlias"
            name="applicantAlias"
            required
            placeholder="e.g. researcher-42"
          />
          <span className="hint">Used for pseudonymous submission. Not shared with reviewers.</span>
        </div>
        <div className="field">
          <label htmlFor="title">Proposal title</label>
          <input id="title" name="title" required />
        </div>
        <div className="field">
          <label htmlFor="abstract">Abstract</label>
          <textarea
            id="abstract"
            name="abstract"
            rows={6}
            required
            placeholder="Explain the project, its goals, and expected outcomes."
          />
        </div>
        <div className="field">
          <label htmlFor="requestedBudgetKEur">Requested budget (k EUR)</label>
          <input
            id="requestedBudgetKEur"
            name="requestedBudgetKEur"
            type="number"
            min="1"
            max="500"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="budgetUsage">Budget usage</label>
          <textarea
            id="budgetUsage"
            name="budgetUsage"
            rows={4}
            required
            placeholder="How will the requested budget be used? Break down by category (development, testing, documentation, etc.)."
          />
        </div>
        <div className="field">
          <label htmlFor="tasksBreakdown">Tasks breakdown</label>
          <textarea
            id="tasksBreakdown"
            name="tasksBreakdown"
            rows={6}
            required
            placeholder="List the main tasks with estimated effort and rates.&#10;&#10;Example:&#10;T1: Core implementation — 3 months, 1 FTE @ 5k/month&#10;T2: Testing and audit — 1 month, 0.5 FTE @ 5k/month"
          />
        </div>
        {error && <p className="error">{error}</p>}
        <div className="actions-row">
          <button type="submit" disabled={loading}>
            <Send size={16} />
            {loading ? "Submitting…" : "Submit proposal"}
          </button>
        </div>
      </form>
    </main>
  );
}
