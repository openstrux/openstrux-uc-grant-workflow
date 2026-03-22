/**
 * benchmarkService — reads benchmark result JSON files from results/ directory.
 *
 * This service is pre-built (not generated). It reads results/*/benchmark.json,
 * validates each against the Zod schema, and surfaces valid results to the
 * /results page.
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { BenchmarkResultSchema, type BenchmarkResult } from "@grant-workflow/benchmark-model";

/** Resolve the results/ directory relative to the monorepo root. */
function resolveResultsDir(): string {
  // Next.js sets cwd to app/web/ — results/ lives two levels up at repo root.
  return join(process.cwd(), "..", "..", "results");
}

export async function loadBenchmarkResults(): Promise<BenchmarkResult[]> {
  const resultsDir = resolveResultsDir();

  if (!existsSync(resultsDir)) {
    return [];
  }

  const results: BenchmarkResult[] = [];
  const errors: Array<{ dir: string; error: string }> = [];

  const entries = readdirSync(resultsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const jsonPath = join(resultsDir, entry.name, "benchmark.json");
    if (!existsSync(jsonPath)) continue;

    try {
      const raw = readFileSync(jsonPath, "utf-8");
      const parsed = BenchmarkResultSchema.safeParse(JSON.parse(raw));
      if (parsed.success) {
        results.push(parsed.data);
      } else {
        errors.push({ dir: entry.name, error: parsed.error.message });
      }
    } catch (err) {
      errors.push({
        dir: entry.name,
        error: err instanceof Error ? err.message : "Unknown parse error",
      });
    }
  }

  if (errors.length > 0) {
    console.warn(
      `[benchmarkService] Skipped ${errors.length} invalid result(s):`,
      errors.map((e) => `${e.dir}: ${e.error}`).join("; "),
    );
  }

  return results.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}
