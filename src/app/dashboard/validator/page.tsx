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
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card header={<span className="text-sm font-semibold text-slate-800">Shortlisted proposals</span>}>
          <ProposalTable rows={rows} role="validator" onSelect={setSelected} />
        </Card>

        {selected ? (
          <Card header={
            <span className="text-sm font-semibold text-slate-800">
              Validate: <code className="text-xs font-normal">{selected.id.slice(0, 8)}</code>
            </span>
          }>
            <form onSubmit={handleValidate} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Reviewer recommendation</label>
                <p className="text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                  {selected.recommendation ?? "No recommendation recorded"}
                </p>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Decision <span className="text-red-500">*</span></label>
                <Select
                  value={decision}
                  onChange={setDecision}
                  options={DECISION_OPTIONS}
                  placeholder="Select decision…"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Notes <span className="text-red-500">*</span></label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  required
                  placeholder="Validation notes…"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" type="button" onClick={() => setSelected(null)}>Cancel</Button>
                <Button type="submit" isLoading={submitting} disabled={!decision || !notes}>
                  Submit decision
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <Card>
            <div className="text-center py-8 text-slate-400 text-sm">
              Select a proposal to validate
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
