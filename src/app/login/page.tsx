"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

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
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
          <p className="text-sm text-slate-500 mt-1">
            Reviewer, validator, admin, and auditor accounts only
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" className="w-full" isLoading={loading}>
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Want to submit a proposal?{" "}
          <Link href="/submit" className="text-indigo-600 font-medium hover:underline">
            Apply here
          </Link>
        </p>
      </div>
    </div>
  );
}
