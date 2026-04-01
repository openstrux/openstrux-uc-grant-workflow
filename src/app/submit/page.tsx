"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Card } from "@/components/ui/Card";
import { Leaf, ArrowRight } from "lucide-react";

const COUNTRIES = [
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark",
  "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland", "Italy",
  "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal",
  "Romania", "Slovakia", "Slovenia", "Spain", "Sweden",
];

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function SubmitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  function validatePasswords(pw: string, confirm: string): boolean {
    const errs: FormErrors = {};
    if (pw.length < 8) errs.password = "Password must be at least 8 characters.";
    if (pw !== confirm) errs.confirmPassword = "Passwords do not match.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const password = form.get("password") as string;
    const confirmPassword = form.get("confirmPassword") as string;
    if (!validatePasswords(password, confirmPassword)) return;

    setLoading(true);
    setErrors({});

    const body = {
      firstName: form.get("firstName") as string,
      lastName: form.get("lastName") as string,
      email: form.get("email") as string,
      organisation: form.get("organisation") as string,
      country: form.get("country") as string,
      website: form.get("website") as string,
      callId: form.get("callId") as string,
      title: form.get("title") as string,
      abstract: form.get("abstract") as string,
      requestedBudgetKEur: Number(form.get("requestedBudgetKEur")),
      budgetUsage: form.get("budgetUsage") as string,
      tasksBreakdown: form.get("tasksBreakdown") as string,
      password,
      privacyPolicy: true as const,
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 409) {
        setErrors({ email: "This email is already registered. Please log in." });
        return;
      }
      if (res.status === 400) {
        const data = (await res.json()) as { error?: string };
        setErrors({ general: data.error ?? "Invalid form data." });
        return;
      }
      if (!res.ok) {
        setErrors({ general: "Submission failed. Please try again." });
        return;
      }

      router.push("/dashboard/applicant");
    } catch {
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(22,163,74,0.07) 0%, transparent 60%), #f8fafc",
      }}
    >
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Page header */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-full mb-5 shadow-sm">
            <Leaf size={12} />
            EU Open Source Fund 2026
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            Submit a{" "}
            <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
              proposal
            </span>
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Your identity is kept separate from your proposal and never shared with reviewers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Section A: Contact information ── */}
          <Card accent="green" header={
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                A
              </span>
              <h2 className="text-sm font-bold text-slate-800">Contact information</h2>
            </div>
          }>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  id="firstName"
                  label="First name"
                  required
                  inputProps={{ name: "firstName", autoComplete: "given-name", placeholder: "Jane" }}
                />
                <FormField
                  id="lastName"
                  label="Last name"
                  required
                  inputProps={{ name: "lastName", autoComplete: "family-name", placeholder: "Smith" }}
                />
              </div>
              <FormField
                id="email"
                label="Email"
                required
                error={errors.email}
                inputProps={{
                  type: "email",
                  name: "email",
                  autoComplete: "email",
                  placeholder: "jane.smith@example.com",
                }}
              />
              <FormField
                id="organisation"
                label="Organisation"
                required
                inputProps={{ name: "organisation", placeholder: "e.g. Open Source Foundation e.V." }}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="country" className="block text-sm font-medium text-slate-700">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="country"
                    name="country"
                    required
                    className="w-full px-3 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                  >
                    <option value="">Select country…</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <FormField
                  id="website"
                  label="Website (optional)"
                  inputProps={{
                    type: "url",
                    name: "website",
                    placeholder: "https://example.org",
                  }}
                />
              </div>
            </div>
          </Card>

          {/* ── Section B: Project information ── */}
          <Card accent="green" header={
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                B
              </span>
              <h2 className="text-sm font-bold text-slate-800">Project information</h2>
            </div>
          }>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="callId" className="block text-sm font-medium text-slate-700">
                  Funding call <span className="text-red-500">*</span>
                </label>
                <select
                  id="callId"
                  name="callId"
                  required
                  className="w-full px-3 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                >
                  <option value="">Select a call…</option>
                  <option value="eu-oss-fund-2026">EU Open Source Fund 2026</option>
                </select>
              </div>
              <FormField
                id="title"
                label="Proposal title"
                required
                inputProps={{ name: "title", placeholder: "A concise, descriptive title" }}
              />
              <FormField
                id="abstract"
                label="Abstract"
                as="textarea"
                required
                hint="Explain your project goals, methodology, and expected outcomes."
                inputProps={{
                  name: "abstract",
                  rows: 6,
                  placeholder: "Describe your project, its goals, and expected outcomes…",
                }}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  id="requestedBudgetKEur"
                  label="Requested budget (k EUR)"
                  required
                  inputProps={{
                    type: "number",
                    name: "requestedBudgetKEur",
                    min: "1",
                    max: "500",
                    placeholder: "e.g. 50",
                  }}
                />
              </div>
              <FormField
                id="budgetUsage"
                label="Budget usage"
                as="textarea"
                required
                hint="Break down by category: development, testing, documentation, etc."
                inputProps={{
                  name: "budgetUsage",
                  rows: 4,
                  placeholder: "Development: 40k EUR\nTesting & audit: 10k EUR\n…",
                }}
              />
              <FormField
                id="tasksBreakdown"
                label="Tasks breakdown"
                as="textarea"
                required
                hint="List main tasks with estimated effort and rates."
                inputProps={{
                  name: "tasksBreakdown",
                  rows: 6,
                  placeholder:
                    "T1: Core implementation — 3 months, 1 FTE @ 5k/month\nT2: Testing — 1 month, 0.5 FTE @ 5k/month\n…",
                }}
              />
            </div>
          </Card>

          {/* ── Section C: Account creation ── */}
          <Card accent="green" header={
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                C
              </span>
              <h2 className="text-sm font-bold text-slate-800">Create your account</h2>
            </div>
          }>
            <div className="space-y-4">
              <p className="text-xs text-slate-500 bg-green-50/60 border border-green-100 rounded-xl px-4 py-3">
                Your account lets you track your proposal status after submission.
              </p>
              <FormField
                id="password"
                label="Password"
                required
                error={errors.password}
                hint="Minimum 8 characters."
                inputProps={{
                  type: "password",
                  name: "password",
                  autoComplete: "new-password",
                  minLength: 8,
                }}
              />
              <FormField
                id="confirmPassword"
                label="Confirm password"
                required
                error={errors.confirmPassword}
                inputProps={{
                  type: "password",
                  name: "confirmPassword",
                  autoComplete: "new-password",
                }}
              />
              <div className="flex items-start gap-3 pt-1">
                <input
                  id="privacyPolicy"
                  name="privacyPolicy"
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="privacyPolicy" className="text-xs text-slate-600 leading-relaxed">
                  I have read and agree to the privacy policy. I understand my personal data will be
                  used solely for processing this application and will not be shared with reviewers.
                </label>
              </div>
            </div>
          </Card>

          {errors.general && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
              {errors.general}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="submit" size="lg" isLoading={loading}>
              Submit proposal
              <ArrowRight size={16} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
