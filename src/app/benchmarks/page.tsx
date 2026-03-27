"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import type { BenchmarkResult } from "@/app/api/benchmarks/route";

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function num(n: number): string {
  return n.toLocaleString();
}

export default function BenchmarksPage() {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/benchmarks")
      .then((r) => r.json() as Promise<BenchmarkResult[]>)
      .then((data) => setResults(data))
      .finally(() => setLoading(false));
  }, []);

  const direct = results.filter((r) => r.path === "direct");
  const openstrux = results.filter((r) => r.path === "openstrux");

  const summaryCards = [
    {
      path: "Direct",
      runs: direct.length,
      avgTokens: avg(direct.map((r) => r.tokens)),
      avgTurns: avg(direct.map((r) => r.turns)),
      avgPassRate: avg(direct.map((r) => r.passRate)),
    },
    {
      path: "Openstrux",
      runs: openstrux.length,
      avgTokens: avg(openstrux.map((r) => r.tokens)),
      avgTurns: avg(openstrux.map((r) => r.turns)),
      avgPassRate: avg(openstrux.map((r) => r.passRate)),
    },
  ];

  const columns = [
    { key: "date", header: "Date", render: (r: BenchmarkResult) => new Date(r.date).toLocaleDateString() },
    {
      key: "path",
      header: "Path",
      render: (r: BenchmarkResult) => (
        <span
          className={[
            "inline-flex px-2 py-0.5 text-xs font-semibold rounded-full",
            r.path === "openstrux"
              ? "bg-indigo-50 text-indigo-700"
              : "bg-slate-100 text-slate-600",
          ].join(" ")}
        >
          {r.path}
        </span>
      ),
    },
    { key: "tokens", header: "Tokens", render: (r: BenchmarkResult) => num(r.tokens) },
    { key: "turns", header: "Turns", render: (r: BenchmarkResult) => r.turns },
    {
      key: "passRate",
      header: "Pass rate",
      render: (r: BenchmarkResult) => (
        <span className={r.passRate >= 0.9 ? "text-emerald-600 font-medium" : r.passRate >= 0.7 ? "text-amber-600" : "text-red-600"}>
          {pct(r.passRate)} ({r.passCount}/{r.totalTests})
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <BarChart3 size={24} className="text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Benchmark results</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Direct AI generation vs. Openstrux-guided generation
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : results.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <TrendingUp size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">No benchmark results yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Run a benchmark using the runner script to see results here.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {summaryCards.map((s) => (
              <Card
                key={s.path}
                header={
                  <span className="text-sm font-semibold text-slate-800">
                    {s.path} ({s.runs} runs)
                  </span>
                }
              >
                <dl className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <dt className="text-slate-500">Avg tokens</dt>
                    <dd className="font-medium text-slate-800">{num(Math.round(s.avgTokens))}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-slate-500">Avg turns</dt>
                    <dd className="font-medium text-slate-800">{s.avgTurns.toFixed(1)}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-slate-500">Avg pass rate</dt>
                    <dd className="font-medium text-slate-800">{pct(s.avgPassRate)}</dd>
                  </div>
                </dl>
              </Card>
            ))}
          </div>

          {/* Results table */}
          <Card header={<span className="text-sm font-semibold text-slate-800">All runs</span>}>
            <DataTable
              columns={columns}
              rows={results}
              getRowKey={(r) => r.slug}
              emptyState={<p>No results</p>}
            />
          </Card>
        </>
      )}
    </div>
  );
}
