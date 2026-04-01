"use client";

import Link from "next/link";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import {
  ChevronDown,
  Globe,
  Eye,
  Scale,
  ArrowRight,
  CheckCircle,
  BarChart3,
  Leaf,
} from "lucide-react";
import { SectionSeparator } from "@/components/layout/SectionSeparator";

const FEATURES = [
  {
    icon: <Globe size={20} className="text-green-600" />,
    iconBg: "bg-green-50",
    title: "Open Calls",
    description:
      "Transparent, publicly announced funding calls with clear eligibility criteria and timelines.",
  },
  {
    icon: <Eye size={20} className="text-blue-600" />,
    iconBg: "bg-blue-50",
    title: "Blinded Review",
    description:
      "Reviewer identities and applicant identities are kept separate to eliminate bias in evaluation.",
  },
  {
    icon: <Scale size={20} className="text-indigo-600" />,
    iconBg: "bg-indigo-50",
    title: "Fair Process",
    description:
      "Multi-stage validation with independent auditor access ensures accountability and compliance.",
  },
];

const PROCESS_STEPS = [
  {
    step: "1",
    title: "Submit Proposal",
    desc: "Complete the online form with your project details and budget.",
    color: "bg-gradient-to-br from-green-500 to-emerald-600",
  },
  {
    step: "2",
    title: "Eligibility Check",
    desc: "Administrators verify your submission meets programme criteria.",
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
  },
  {
    step: "3",
    title: "Blinded Review",
    desc: "Assigned reviewers evaluate proposals without knowing applicant identity.",
    color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
  },
  {
    step: "4",
    title: "Decision",
    desc: "Validator makes the final decision; all applicants notified with reasons.",
    color: "bg-gradient-to-br from-slate-600 to-slate-700",
  },
];

const MANIFESTO_POINTS = [
  {
    title: "Structured, not Scripted",
    desc: "Openstrux defines process structure — roles, gates, data shapes — leaving implementation freedom to AI generation.",
  },
  {
    title: "Privacy by Default",
    desc: "Blinded identifiers and access control policies are first-class citizens in every Openstrux workflow.",
  },
  {
    title: "Benchmark-Driven Quality",
    desc: "Every spec is validated against concrete benchmarks comparing Openstrux-guided vs. direct AI generation.",
  },
  {
    title: "Human-Auditable",
    desc: "Generated artefacts are readable, reviewable, and Git-tracked — no black-box output.",
  },
];

const PRIVACY_FAQ = [
  {
    q: "What personal data do you collect?",
    a: "We collect only the minimum necessary: contact details (name, email, organisation, country) and project information. Applicant identity is stored separately from proposal content and never shared with reviewers.",
  },
  {
    q: "Who can see my proposal?",
    a: "Reviewers see only the project title, abstract, and budget — not your identity. Administrators can access full proposals for eligibility checks. Auditors see anonymised event logs.",
  },
  {
    q: "How is my data stored?",
    a: "All data is stored within the EU on encrypted infrastructure. We do not transfer personal data outside the European Economic Area.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero section ───────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% -20%, rgba(22,163,74,0.08) 0%, rgba(37,99,235,0.06) 50%, transparent 70%), linear-gradient(180deg, #f8fafc 0%, #f0fdf4 50%, #f8fafc 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #16a34a 0%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-24 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 70%)" }}
        />

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-full mb-8 shadow-sm">
              <Leaf size={12} />
              EU Open Source Fund 2026
            </span>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              Privacy-first grant<br />
              <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                review, reimagined
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Submit your open-source project proposal for EU funding through a transparent,
              blinded review process designed to eliminate bias.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/submit"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-bold text-white rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-150 active:scale-[0.98]"
              >
                Submit your proposal
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-slate-700 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all duration-150"
              >
                Reviewer / Admin login
              </Link>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="grid sm:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`group bg-white border border-slate-200 rounded-2xl p-7 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up animate-delay-${(i + 1) * 100}`}
              >
                <div className={`w-10 h-10 ${f.iconBg} rounded-xl flex items-center justify-center mb-5 shadow-sm`}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Process timeline */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-3">How it works</h2>
          <p className="text-sm text-slate-500 text-center mb-12 max-w-xl mx-auto">
            A transparent four-step process from submission to decision.
          </p>
          <div className="grid sm:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((s, i) => (
              <div
                key={s.step}
                className={`flex flex-col gap-4 animate-fade-in-up animate-delay-${(i + 1) * 100}`}
              >
                <span
                  className={`w-10 h-10 rounded-xl ${s.color} text-white text-sm font-bold flex items-center justify-center shadow-md`}
                >
                  {s.step}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800 mb-1">{s.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy accordion */}
        <section className="max-w-3xl mx-auto px-6 pb-24">
          <h2 className="text-lg font-bold text-slate-800 mb-2 text-center">Privacy &amp; data protection</h2>
          <p className="text-sm text-slate-500 text-center mb-8">Your data stays in the EU, always.</p>
          <div className="space-y-3">
            {PRIVACY_FAQ.map(({ q, a }) => (
              <Disclosure key={q}>
                {({ open }) => (
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <DisclosureButton className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-slate-800 hover:bg-slate-50/70 transition-colors text-left">
                      {q}
                      <ChevronDown
                        size={16}
                        className={`text-slate-400 transition-transform shrink-0 ml-4 ${open ? "rotate-180" : ""}`}
                      />
                    </DisclosureButton>
                    <DisclosurePanel className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                      {a}
                    </DisclosurePanel>
                  </div>
                )}
              </Disclosure>
            ))}
          </div>
        </section>
      </div>

      {/* ── Separator ─────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6">
        <SectionSeparator label="About this demo" />
      </div>

      {/* ── Openstrux section ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Powered by Openstrux</h2>
          <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            This portal is a benchmark use case for the{" "}
            <strong className="text-slate-700">Openstrux</strong> language — a structured workflow
            specification format designed to guide AI-generated applications.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-12">
          {MANIFESTO_POINTS.map((p, i) => (
            <div
              key={p.title}
              className={`group border border-slate-200 rounded-2xl p-6 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up animate-delay-${(i + 1) * 100}`}
            >
              <div className="flex items-start gap-4">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <CheckCircle size={14} className="text-white" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-1.5">{p.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/benchmarks"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-bold text-white rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-150 active:scale-[0.98]"
          >
            <BarChart3 size={16} />
            View benchmark results
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-10 text-center">
        <p className="text-xs text-slate-400">
          Grant Workflow — Privacy-first review system · Built with Openstrux v0.6
        </p>
      </footer>
    </>
  );
}
