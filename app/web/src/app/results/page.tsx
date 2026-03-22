/**
 * /results — Benchmark results viewer.
 *
 * Displays side-by-side comparison data for all recorded generation runs.
 * This page is pre-built infrastructure (not generated). It reads validated
 * benchmark.json files from results/ via the benchmarkService and renders
 * a comparison table with all measurement fields.
 */

import { loadBenchmarkResults } from "@/server/services/benchmarkService";
import { BarChart3 } from "lucide-react";

function formatDuration(ms: number | undefined): string {
  if (ms === undefined) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatNumber(n: number | undefined): string {
  if (n === undefined) return "—";
  return n.toLocaleString();
}

export default async function ResultsPage() {
  const results = await loadBenchmarkResults();

  return (
    <main>
      <h1>
        <BarChart3 size={24} style={{ verticalAlign: "text-bottom", marginRight: "0.5rem" }} />
        Benchmark Results
      </h1>
      <p>
        Side-by-side comparison of baseline (direct TS) vs Openstrux-assisted generation. Each row
        represents one generation run recorded via <code>pnpm save-result</code>.
      </p>

      {results.length === 0 ? (
        <div className="empty-state">
          <p>No benchmark runs yet.</p>
          <p>
            Run a generation path and use <code>pnpm save-result</code> to record a result.
          </p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Path</th>
              <th>LLM</th>
              <th>Files</th>
              <th>Lines</th>
              <th>Tokens</th>
              <th>Time</th>
              <th>Repair?</th>
              <th>Test results</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i}>
                <td>{new Date(r.timestamp).toLocaleDateString()}</td>
                <td>
                  <span
                    className={`badge ${
                      r.path === "openstrux" ? "badge-eligible" : "badge-pending"
                    }`}
                  >
                    {r.path}
                  </span>
                </td>
                <td>{r.llm ?? "—"}</td>
                <td>{formatNumber(r.generatedFileCount)}</td>
                <td>{formatNumber(r.totalLines)}</td>
                <td>{formatNumber(r.tokenCount)}</td>
                <td>{formatDuration(r.executionTimeMs)}</td>
                <td>{r.repairNeeded === undefined ? "—" : r.repairNeeded ? "yes" : "no"}</td>
                <td>{r.manualTestResults ?? "—"}</td>
                <td>{r.resultNote ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
