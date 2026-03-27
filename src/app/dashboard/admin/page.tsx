"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ProposalTable } from "@/components/proposal/ProposalTable";
import type { SubmissionRow } from "@/components/proposal/ProposalTable";
import { FileText, Users, CheckCircle, Clock } from "lucide-react";

// Stub stats
const STATS = [
  { label: "Total proposals", value: 0, icon: <FileText size={18} className="text-indigo-500" /> },
  { label: "Under review", value: 0, icon: <Clock size={18} className="text-amber-500" /> },
  { label: "Eligible", value: 0, icon: <CheckCircle size={18} className="text-emerald-500" /> },
  { label: "Reviewers", value: 0, icon: <Users size={18} className="text-blue-500" /> },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [rows] = useState<SubmissionRow[]>([]);
  const [assignTarget, setAssignTarget] = useState<SubmissionRow | null>(null);
  const [reviewerId, setReviewerId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Verify session client-side (proxy handles server-side redirect)
  useEffect(() => {
    fetch("/api/proposals").then((r) => {
      if (r.status === 401) router.push("/login");
    });
  }, [router]);

  async function handleAssign() {
    if (!assignTarget || !reviewerId.trim()) return;
    setAssigning(true);
    try {
      await fetch(`/api/proposals/${assignTarget.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerId: reviewerId.trim() }),
      });
    } finally {
      setAssigning(false);
      setAssignTarget(null);
      setReviewerId("");
    }
  }

  return (
    <AppShell role="admin" userId="dev-admin-1" pageTitle="Admin Dashboard">
      <DashboardHeader
        title="Review Administrator"
        subtitle="EU Open Source Fund 2026"
        intro="Manage all submissions, assign reviewers, and track the review pipeline."
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {STATS.map((s) => (
          <Card key={s.label} className="!py-4">
            <div className="flex items-center gap-3">
              {s.icon}
              <div>
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Proposals table */}
      <Card header={<span className="text-sm font-semibold text-slate-800">All proposals</span>}>
        <ProposalTable
          rows={rows}
          role="admin"
          onSelect={(row) => setAssignTarget(row)}
        />
      </Card>

      {/* Assign reviewer modal */}
      <Modal
        open={assignTarget !== null}
        onClose={() => setAssignTarget(null)}
        title="Assign reviewer"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Assign a reviewer to proposal{" "}
            <code className="text-xs bg-slate-100 px-1 rounded">{assignTarget?.id.slice(0, 8)}</code>.
          </p>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Reviewer ID</label>
            <input
              value={reviewerId}
              onChange={(e) => setReviewerId(e.target.value)}
              placeholder="dev-reviewer-1"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setAssignTarget(null)}>Cancel</Button>
            <Button isLoading={assigning} onClick={handleAssign}>Assign</Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
