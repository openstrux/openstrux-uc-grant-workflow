/**
 * GET /api/benchmarks
 *
 * Reads ../openstrux/benchmarks/results/ at request time and returns
 * parsed BenchmarkResult[] sorted by date descending.
 *
 * Each subdirectory matching YYYYMMDD-HHmmss-<path> must contain:
 *   - generation-meta.json
 *   - test-unit.json
 *
 * Skips malformed directories. Returns [] if results directory is absent.
 * No auth required (public benchmark data).
 */

import { NextResponse } from "next/server";
import { readdir, readFile, stat } from "fs/promises";
import path from "path";

export interface BenchmarkResult {
  slug: string;
  date: string;
  path: "direct" | "openstrux";
  tokens: number;
  turns: number;
  durationMs: number;
  passCount: number;
  totalTests: number;
  passRate: number;
}

const SLUG_PATTERN = /^(\d{8}-\d{6})-(direct|openstrux)$/;
// Path relative to the grant-workflow project root
const RESULTS_DIR = path.resolve(process.cwd(), "..", "openstrux", "benchmarks", "results");

async function parseResult(dir: string, slug: string): Promise<BenchmarkResult | null> {
  try {
    const match = SLUG_PATTERN.exec(slug);
    if (!match) return null;

    const dateStr = match[1];
    const runPath = match[2] as "direct" | "openstrux";

    const [metaRaw, testRaw] = await Promise.all([
      readFile(path.join(dir, "generation-meta.json"), "utf-8"),
      readFile(path.join(dir, "test-unit.json"), "utf-8"),
    ]);

    const meta = JSON.parse(metaRaw) as {
      totalTokens?: number;
      inputTokens?: number;
      outputTokens?: number;
      turns?: number;
      durationMs?: number;
    };
    const tests = JSON.parse(testRaw) as {
      numPassedTests?: number;
      numTotalTests?: number;
      success?: boolean;
      testResults?: Array<{ status: string }>;
    };

    const tokens =
      meta.totalTokens ??
      (meta.inputTokens ?? 0) + (meta.outputTokens ?? 0);
    const turns = meta.turns ?? 0;
    const durationMs = meta.durationMs ?? 0;

    let passCount = tests.numPassedTests ?? 0;
    let totalTests = tests.numTotalTests ?? 0;
    if (totalTests === 0 && Array.isArray(tests.testResults)) {
      totalTests = tests.testResults.length;
      passCount = tests.testResults.filter((t) => t.status === "passed").length;
    }
    const passRate = totalTests > 0 ? passCount / totalTests : 0;

    return {
      slug,
      date: `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T${dateStr.slice(9, 11)}:${dateStr.slice(11, 13)}:${dateStr.slice(13, 15)}Z`,
      path: runPath,
      tokens,
      turns,
      durationMs,
      passCount,
      totalTests,
      passRate,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const entries = await readdir(RESULTS_DIR);
    const results: BenchmarkResult[] = [];

    for (const entry of entries) {
      const fullPath = path.join(RESULTS_DIR, entry);
      try {
        const s = await stat(fullPath);
        if (!s.isDirectory()) continue;
      } catch {
        continue;
      }
      const result = await parseResult(fullPath, entry);
      if (result) results.push(result);
    }

    results.sort((a, b) => b.date.localeCompare(a.date));
    return NextResponse.json(results, { status: 200 });
  } catch {
    // Results directory absent or unreadable — graceful degradation
    return NextResponse.json([], { status: 200 });
  }
}
