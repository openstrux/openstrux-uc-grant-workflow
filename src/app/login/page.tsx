"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const body = {
      email: form.get("email") as string,
      password: form.get("password") as string,
    };

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        setError("Invalid email or password.");
        return;
      }
      if (!res.ok) {
        setError("Login failed. Please try again.");
        return;
      }

      const data = (await res.json()) as { role: string };
      router.push(`/dashboard/${data.role}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-[calc(100vh-3.75rem)] flex items-center justify-center px-4 py-16"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37,99,235,0.09) 0%, rgba(79,70,229,0.06) 40%, transparent 65%), #f8fafc",
      }}
    >
      {/* Decorative blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-sm relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mx-auto mb-5 flex items-center justify-center shadow-lg shadow-blue-200/60">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff sign in</h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Reviewer, validator, admin, and auditor accounts only
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          {/* Blue accent bar — clipped to rounded corners by overflow-hidden */}
          <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <form onSubmit={handleSubmit} className="space-y-5 p-8">
            <FormField
              id="email"
              label="Email"
              required
              inputProps={{
                type: "email",
                name: "email",
                autoComplete: "email",
                placeholder: "you@example.com",
              }}
            />
            <FormField
              id="password"
              label="Password"
              required
              inputProps={{
                type: "password",
                name: "password",
                autoComplete: "current-password",
                placeholder: "••••••••",
              }}
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <Button type="submit" variant="admin" className="w-full" size="lg" isLoading={loading}>
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Want to submit a proposal?{" "}
          <Link href="/submit" className="text-green-600 font-semibold hover:text-green-700 hover:underline transition-colors">
            Apply here
          </Link>
        </p>
      </div>
    </div>
  );
}
