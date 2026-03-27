"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ProposalTable } from "@/components/proposal/ProposalTable";
import type { SubmissionRow } from "@/components/proposal/ProposalTable";

const RECOMMENDATION_OPTIONS = [
  { value: "shortlist", label: "Shortlist" },
  { value: "reject", label: "Reject" },
  { value: "request_clarification", label: "Request clarification" },
];

export default function ReviewerDashboard() {
  const router = useRouter();
  const [rows] = useState<SubmissionRow[]>([]);
  const [selected, setSelected] = useState<SubmissionRow | null>(null);
  const [notes, setNotes] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/proposals").then((r) => {
      if (r.status === 401) router.push("/login");
    });
  }, [router]);

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !notes.trim() || !recommendation) return;
    setSubmitting(true);
    try {
      await fetch(`/api/proposals/${selected.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, recommendation }),
      });
      setSelected(null);
      setNotes("");
      setRecommendation("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell role="reviewer" userId="dev-reviewer-1" pageTitle="Review Queue">
      <DashboardHeader
        title="Review queue"
        subtitle="Blinded review — applicant identities are hidden"
        intro="Review assigned proposals and submit your recommendation."
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card header={<span className="text-sm font-semibold text-slate-800">Assigned proposals</span>}>
          <ProposalTable rows={rows} role="reviewer" onSelect={setSelected} />
        </Card>

        {selected ? (
          <Card header={
            <span className="text-sm font-semibold text-slate-800">
              Review: <code className="text-xs font-normal">{selected.id.slice(0, 8)}</code>
            </span>
          }>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Notes <span className="text-red-500">*</span></label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  required
                  placeholder="Provide your review notes…"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Recommendation <span className="text-red-500">*</span></label>
                <Select
                  value={recommendation}
                  onChange={setRecommendation}
                  options={RECOMMENDATION_OPTIONS}
                  placeholder="Select recommendation…"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" type="button" onClick={() => setSelected(null)}>Cancel</Button>
                <Button type="submit" isLoading={submitting} disabled={!notes || !recommendation}>
                  Submit review
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <Card>
            <div className="text-center py-8 text-slate-400 text-sm">
              Select a proposal to review
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
