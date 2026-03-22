/**
 * /admin/proposals/[id]/eligibility — Eligibility check form.
 *
 * Presents explicit boolean/numeric eligibility inputs per FR-P2-001.
 * No semantic reading of proposal content — all inputs are manual.
 */

"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function EligibilityPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const body = {
      submissionId: params.id,
      inputs: {
        submittedInEnglish: form.get("submittedInEnglish") === "true",
        alignedWithCall: form.get("alignedWithCall") === "true",
        primaryObjectiveIsRd: form.get("primaryObjectiveIsRd") === "true",
        meetsEuropeanDimension: form.get("meetsEuropeanDimension") as string,
        requestedBudgetKEur: Number(form.get("requestedBudgetKEur")),
        firstTimeApplicantInProgramme:
          form.get("firstTimeApplicantInProgramme") === "true",
      },
    };

    try {
      const res = await fetch("/api/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      router.push(`/admin/proposals/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eligibility check failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <a href={`/admin/proposals/${params.id}`} className="link-back">
        <ArrowLeft size={14} />
        Back to proposal
      </a>

      <h1>Eligibility Check</h1>
      <p>All criteria are evaluated as explicit boolean or numeric inputs — no semantic analysis.</p>

      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label>Submitted in English</label>
          <select name="submittedInEnglish" required>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div className="field">
          <label>Aligned with call objectives</label>
          <select name="alignedWithCall" required>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div className="field">
          <label>Primary objective is R&amp;D</label>
          <select name="primaryObjectiveIsRd" required>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div className="field">
          <label>Meets European dimension</label>
          <select name="meetsEuropeanDimension" required>
            <option value="true">Yes</option>
            <option value="false">No</option>
            <option value="not_applicable">Not applicable</option>
          </select>
        </div>
        <div className="field">
          <label>Requested budget (k EUR)</label>
          <input
            name="requestedBudgetKEur"
            type="number"
            min="1"
            max="500"
            required
          />
        </div>
        <div className="field">
          <label>First-time applicant in this programme</label>
          <select name="firstTimeApplicantInProgramme" required>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="actions-row">
          <button type="submit" disabled={loading}>
            <ShieldCheck size={16} />
            {loading ? "Evaluating…" : "Run eligibility check"}
          </button>
        </div>
      </form>
    </main>
  );
}
