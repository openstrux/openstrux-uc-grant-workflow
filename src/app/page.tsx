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
} from "lucide-react";
import { SectionSeparator } from "@/components/layout/SectionSeparator";

const FEATURES = [
  {
    icon: <Globe size={20} className="text-indigo-500" />,
    title: "Open Calls",
    description:
      "Transparent, publicly announced funding calls with clear eligibility criteria and timelines.",
  },
  {
    icon: <Eye size={20} className="text-indigo-500" />,
    title: "Blinded Review",
    description:
      "Reviewer identities and applicant identities are kept separate to eliminate bias in evaluation.",
  },
  {
    icon: <Scale size={20} className="text-indigo-500" />,
    title: "Fair Process",
    description:
      "Multi-stage validation with independent auditor access ensures accountability and compliance.",
  },
];

const PROCESS_STEPS = [
  { step: "1", title: "Submit Proposal", desc: "Complete the online form with your project details and budget." },
  { step: "2", title: "Eligibility Check", desc: "Administrators verify your submission meets programme criteria." },
  { step: "3", title: "Blinded Review", desc: "Assigned reviewers evaluate proposals without knowing applicant identity." },
  { step: "4", title: "Decision", desc: "Validator makes the final decision; all applicants notified with reasons." },
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
      {/* ── Section 1: EU Grant Portal ─────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 70%), linear-gradient(180deg, #fafafa 0%, #f0f4ff 100%)",
        }}
      >
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full mb-6">
              🇪🇺 EU Open Source Fund 2026
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
              Privacy-first grant<br />review, reimagined
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto mb-8">
              Submit your open-source project proposal for EU funding through a transparent,
              blinded review process designed to eliminate bias.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Submit your proposal
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Reviewer / Admin login
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="grid sm:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-fade-in-up animate-delay-${(i + 1) * 100}`}
              >
                <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Process timeline */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <h2 className="text-xl font-bold text-slate-900 text-center mb-8">How it works</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            {PROCESS_STEPS.map((s, i) => (
              <div key={s.step} className={`animate-fade-in-up animate-delay-${(i + 1) * 100}`}>
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {s.step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy accordion */}
        <section className="max-w-3xl mx-auto px-6 pb-20">
          <h2 className="text-base font-semibold text-slate-700 mb-4 text-center">
            Privacy &amp; data protection
          </h2>
          <div className="space-y-2">
            {PRIVACY_FAQ.map(({ q, a }) => (
              <Disclosure key={q}>
                {({ open }) => (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <DisclosureButton className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left">
                      {q}
                      <ChevronDown
                        size={16}
                        className={`text-slate-400 transition-transform shrink-0 ml-3 ${open ? "rotate-180" : ""}`}
                      />
                    </DisclosureButton>
                    <DisclosurePanel className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">
                      {a}
                    </DisclosurePanel>
                  </div>
                )}
              </Disclosure>
            ))}
          </div>
        </section>
      </div>

      {/* ── Separator ───────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6">
        <SectionSeparator label="About this demo" />
      </div>

      {/* ── Section 2: Openstrux Benchmark Demo ─────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-10 animate-fade-in-up">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Powered by Openstrux</h2>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
            This portal is a benchmark use case for the{" "}
            <strong className="text-slate-700">Openstrux</strong> language — a structured workflow
            specification format designed to guide AI-generated applications. The grant workflow is
            generated in two paths (direct prompt vs. Openstrux-guided) and the results are
            compared on code quality, correctness, and token efficiency.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-10">
          {MANIFESTO_POINTS.map((p, i) => (
            <div
              key={p.title}
              className={`border border-slate-200 rounded-xl p-5 bg-white animate-fade-in-up animate-delay-${(i + 1) * 100}`}
            >
              <div className="flex items-start gap-3">
                <CheckCircle size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{p.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/benchmarks"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
          >
            <BarChart3 size={16} />
            View benchmark results
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-400">
        Grant Workflow — Privacy-first review system · Built with Openstrux v0.6
      </footer>
    </>
  );
}
