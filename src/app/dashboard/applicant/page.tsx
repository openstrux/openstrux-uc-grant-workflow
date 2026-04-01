import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getSubmission } from "@/server/services/submissionService";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/proposal/StatusBadge";
import { FileText, ArrowRight, CheckCircle2, Circle } from "lucide-react";

const STEPS = [
  "Submitted",
  "Eligibility check",
  "Under review",
  "Validation",
  "Decision",
] as const;

const STEP_STATUSES: Record<string, number> = {
  submitted: 0,
  eligible: 1,
  under_review: 2,
  validation_pending: 3,
  selected: 4,
  rejected: 4,
  eligibility_failed: 1,
  clarification_requested: 2,
  revised: 2,
  draft: -1,
};

export default async function ApplicantDashboard() {
  const session = await getSession();
  if (!session || session.role !== "applicant") redirect("/login");

  const proposal = session.submissionId
    ? await getSubmission(session.submissionId)
    : null;

  const currentStep = proposal ? (STEP_STATUSES[proposal.status] ?? 0) : -1;

  return (
    <AppShell role={session.role} userId={session.userId} pageTitle="My Proposal">
      <DashboardHeader
        title="My proposal"
        subtitle="EU Open Source Fund 2026"
        accentColor="green"
      />

      {proposal === null ? (
        <Card accent="green">
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-5 shadow-sm">
              <FileText size={28} className="text-green-500" />
            </div>
            <p className="text-base font-bold text-slate-800 mb-2">No proposal submitted yet</p>
            <p className="text-sm text-slate-400 mb-7 max-w-xs leading-relaxed">
              Submit a proposal to start the EU Open Source Fund review process.
            </p>
            <Link
              href="/submit"
              className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-bold text-white rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-150 active:scale-[0.98]"
            >
              Submit a proposal
              <ArrowRight size={15} />
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {/* Status card */}
          <Card
            accent="green"
            header={
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">
                  {proposal.effectiveVersion?.title ?? "Untitled proposal"}
                </span>
                <StatusBadge status={proposal.status as Parameters<typeof StatusBadge>[0]["status"]} />
              </div>
            }
          >
            <p className="text-xs text-slate-400">
              Submitted on {new Date(proposal.submittedAt).toLocaleDateString()}
            </p>
          </Card>

          {/* Progress timeline */}
          <Card
            accent="green"
            header={<span className="text-sm font-bold text-slate-800">Review progress</span>}
          >
            <ol className="space-y-4">
              {STEPS.map((label, i) => {
                const done = i <= currentStep;
                const active = i === currentStep + 1;
                return (
                  <li key={label} className="flex items-center gap-4">
                    <div className="shrink-0">
                      {done ? (
                        <CheckCircle2 size={22} className="text-green-500" />
                      ) : active ? (
                        <div className="w-[22px] h-[22px] rounded-full border-2 border-green-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                        </div>
                      ) : (
                        <Circle size={22} className="text-slate-200" />
                      )}
                    </div>
                    <span className={`text-sm ${done ? "text-slate-800 font-semibold" : active ? "text-green-700 font-medium" : "text-slate-400"}`}>
                      {label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
