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

const STATS = [
  {
    label: "Total proposals",
    value: 0,
    icon: <FileText size={20} />,
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  {
    label: "Under review",
    value: 0,
    icon: <Clock size={20} />,
    gradient: "from-amber-400 to-orange-500",
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  {
    label: "Eligible",
    value: 0,
    icon: <CheckCircle size={20} />,
    gradient: "from-emerald-500 to-green-600",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  {
    label: "Reviewers",
    value: 0,
    icon: <Users size={20} />,
    gradient: "from-violet-500 to-indigo-600",
    bg: "bg-violet-50",
    text: "text-violet-600",
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [rows] = useState<SubmissionRow[]>([]);
  const [assignTarget, setAssignTarget] = useState<SubmissionRow | null>(null);
  const [reviewerId, setReviewerId] = useState("");
  const [assigning, setAssigning] = useState(false);

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
        accentColor="blue"
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white shadow-sm`}>
                {s.icon}
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Proposals table */}
      <Card
        accent="blue"
        header={
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
              <FileText size={12} />
            </span>
            <span className="text-sm font-bold text-slate-800">All proposals</span>
          </div>
        }
      >
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
            <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-md">{assignTarget?.id.slice(0, 8)}</code>.
          </p>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Reviewer ID</label>
            <input
              value={reviewerId}
              onChange={(e) => setReviewerId(e.target.value)}
              placeholder="dev-reviewer-1"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" onClick={() => setAssignTarget(null)}>Cancel</Button>
            <Button variant="admin" isLoading={assigning} onClick={handleAssign}>Assign reviewer</Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
