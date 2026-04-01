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

const DECISION_OPTIONS = [
  { value: "approve", label: "Approve" },
  { value: "reject", label: "Reject" },
];

export default function ValidatorDashboard() {
  const router = useRouter();
  const [rows] = useState<SubmissionRow[]>([]);
  const [selected, setSelected] = useState<SubmissionRow | null>(null);
  const [notes, setNotes] = useState("");
  const [decision, setDecision] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/proposals").then((r) => {
      if (r.status === 401) router.push("/login");
    });
  }, [router]);

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !decision || !notes.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`/api/proposals/${selected.id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes }),
      });
      setSelected(null);
      setNotes("");
      setDecision("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell role="validator" userId="dev-validator-1" pageTitle="Validation">
      <DashboardHeader
        title="Validation queue"
        subtitle="Blinded review — applicant identities are hidden"
        intro="Review shortlisted proposals with reviewer recommendations and make the final decision."
        accentColor="blue"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card
          accent="blue"
          header={<span className="text-sm font-bold text-slate-800">Shortlisted proposals</span>}
        >
          <ProposalTable rows={rows} role="validator" onSelect={setSelected} />
        </Card>

        {selected ? (
          <Card
            accent="blue"
            header={
              <span className="text-sm font-bold text-slate-800">
                Validate:{" "}
                <code className="text-xs font-normal bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                  {selected.id.slice(0, 8)}
                </code>
              </span>
            }
          >
            <form onSubmit={handleValidate} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Reviewer recommendation
                </label>
                <p className="text-sm text-slate-600 bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-3">
                  {selected.recommendation ?? "No recommendation recorded"}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Decision <span className="text-red-500">*</span>
                </label>
                <Select
                  value={decision}
                  onChange={setDecision}
                  options={DECISION_OPTIONS}
                  placeholder="Select decision…"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  required
                  placeholder="Validation notes…"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="ghost" type="button" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
                <Button
                  variant="admin"
                  type="submit"
                  isLoading={submitting}
                  disabled={!decision || !notes}
                >
                  Submit decision
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <Card>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <span className="text-blue-400 text-2xl">←</span>
              </div>
              <p className="text-sm font-medium text-slate-600">Select a proposal to validate</p>
              <p className="text-xs text-slate-400 mt-1">Pick one from the shortlist on the left</p>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
