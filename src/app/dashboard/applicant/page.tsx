import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/proposal/StatusBadge";
import { FileText } from "lucide-react";

export default async function ApplicantDashboard() {
  const session = await getSession();
  if (!session || session.role !== "applicant") redirect("/login");

  // Stub data — no DB access in frontend phase
  const proposal = null as null | {
    id: string;
    title: string;
    status: "submitted" | "eligible" | "under_review" | "selected" | "rejected";
    submittedAt: string;
    feedback?: string;
  };

  const STEPS = [
    { label: "Submitted", done: true },
    { label: "Eligibility check", done: false },
    { label: "Under review", done: false },
    { label: "Validation", done: false },
    { label: "Decision", done: false },
  ];

  return (
    <AppShell role={session.role} userId={session.userId} pageTitle="My Proposal">
      <DashboardHeader
        title="My proposal"
        subtitle="EU Open Source Fund 2026"
      />

      {proposal === null ? (
        <Card>
          <div className="text-center py-10">
            <FileText size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">No proposal submitted yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Submit a proposal to start the review process.
            </p>
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Submit a proposal
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Status card */}
          <Card
            header={
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">{proposal.title}</span>
                <StatusBadge status={proposal.status} />
              </div>
            }
          >
            <p className="text-xs text-slate-500">
              Submitted on {new Date(proposal.submittedAt).toLocaleDateString()}
            </p>
          </Card>

          {/* Progress timeline */}
          <Card header={<span className="text-sm font-semibold text-slate-800">Review progress</span>}>
            <ol className="space-y-3">
              {STEPS.map((step, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div
                    className={[
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0",
                      step.done
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-slate-300 text-slate-400",
                    ].join(" ")}
                  >
                    {step.done ? "✓" : i + 1}
                  </div>
                  <span className={`text-sm ${step.done ? "text-slate-700 font-medium" : "text-slate-400"}`}>
                    {step.label}
                  </span>
                </li>
              ))}
            </ol>
          </Card>

          {/* Feedback panel */}
          {proposal.feedback && (
            <Card header={<span className="text-sm font-semibold text-slate-800">Feedback</span>}>
              <p className="text-sm text-slate-600">{proposal.feedback}</p>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
}
