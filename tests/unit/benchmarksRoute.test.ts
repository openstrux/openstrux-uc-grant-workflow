/**
 * Contract tests for GET /api/benchmarks — public benchmark results.
 *
 * Tests filesystem parsing logic, graceful degradation, slug filtering,
 * and result sorting. No auth required (public endpoint). Filesystem
 * functions are mocked.
 *
 * Spec: src/app/api/benchmarks/route.ts
 *   Auth:  none (public)
 *   Codes: 200 always (degrades gracefully to empty array)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("fs/promises", () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn(),
}));

import { GET } from "../../src/app/api/benchmarks/route";
import * as fs from "fs/promises";

const mockReaddir = fs.readdir as ReturnType<typeof vi.fn>;
const mockReadFile = fs.readFile as ReturnType<typeof vi.fn>;
const mockStat = fs.stat as ReturnType<typeof vi.fn>;

const VALID_META = JSON.stringify({ totalTokens: 12000, turns: 5, durationMs: 45000 });
const VALID_TESTS = JSON.stringify({ numPassedTests: 8, numTotalTests: 10 });

beforeEach(() => {
  mockReaddir.mockReset();
  mockReadFile.mockReset();
  mockStat.mockReset();
});

describe("GET /api/benchmarks — graceful degradation", () => {
  it("returns 200 with empty array when results directory does not exist", async () => {
    mockReaddir.mockRejectedValue(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns 200 with empty array when readdir throws unexpectedly", async () => {
    mockReaddir.mockRejectedValue(new Error("unexpected"));
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});

describe("GET /api/benchmarks — slug filtering", () => {
  it("skips entries that are not directories", async () => {
    mockReaddir.mockResolvedValue(["20260326-120000-direct"]);
    mockStat.mockResolvedValue({ isDirectory: () => false });
    const res = await GET();
    expect(await res.json()).toEqual([]);
  });

  it("skips directories with non-conforming slug format", async () => {
    mockReaddir.mockResolvedValue(["invalid-slug", "README.md"]);
    mockStat.mockResolvedValue({ isDirectory: () => true });
    const res = await GET();
    expect(await res.json()).toEqual([]);
  });

  it("accepts direct path slugs", async () => {
    mockReaddir.mockResolvedValue(["20260326-120000-direct"]);
    mockStat.mockResolvedValue({ isDirectory: () => true });
    mockReadFile.mockResolvedValue(VALID_META).mockResolvedValueOnce(VALID_META).mockResolvedValueOnce(VALID_TESTS);
    const res = await GET();
    const results = await res.json() as Array<{ path: string }>;
    expect(results).toHaveLength(1);
    expect(results[0].path).toBe("direct");
  });

  it("accepts openstrux path slugs", async () => {
    mockReaddir.mockResolvedValue(["20260326-120000-openstrux"]);
    mockStat.mockResolvedValue({ isDirectory: () => true });
    mockReadFile.mockResolvedValueOnce(VALID_META).mockResolvedValueOnce(VALID_TESTS);
    const res = await GET();
    const results = await res.json() as Array<{ path: string }>;
    expect(results).toHaveLength(1);
    expect(results[0].path).toBe("openstrux");
  });

  it("skips directories with missing JSON files", async () => {
    mockReaddir.mockResolvedValue(["20260326-120000-direct"]);
    mockStat.mockResolvedValue({ isDirectory: () => true });
    mockReadFile.mockRejectedValue(new Error("ENOENT"));
    const res = await GET();
    expect(await res.json()).toEqual([]);
  });
});

describe("GET /api/benchmarks — result parsing", () => {
  it("parses tokens, turns, durationMs, passCount, and totalTests", async () => {
    mockReaddir.mockResolvedValue(["20260326-120000-direct"]);
    mockStat.mockResolvedValue({ isDirectory: () => true });
    mockReadFile
      .mockResolvedValueOnce(JSON.stringify({ totalTokens: 5000, turns: 3, durationMs: 20000 }))
      .mockResolvedValueOnce(JSON.stringify({ numPassedTests: 7, numTotalTests: 10 }));
    const res = await GET();
    const [result] = await res.json() as Array<{
      tokens: number; turns: number; durationMs: number;
      passCount: number; totalTests: number; passRate: number;
    }>;
    expect(result.tokens).toBe(5000);
    expect(result.turns).toBe(3);
    expect(result.durationMs).toBe(20000);
    expect(result.passCount).toBe(7);
    expect(result.totalTests).toBe(10);
    expect(result.passRate).toBeCloseTo(0.7);
  });

  it("falls back to inputTokens + outputTokens when totalTokens is absent", async () => {
    mockReaddir.mockResolvedValue(["20260326-120000-direct"]);
    mockStat.mockResolvedValue({ isDirectory: () => true });
    mockReadFile
      .mockResolvedValueOnce(JSON.stringify({ inputTokens: 3000, outputTokens: 1500, turns: 2, durationMs: 10000 }))
      .mockResolvedValueOnce(JSON.stringify({ numPassedTests: 5, numTotalTests: 5 }));
    const res = await GET();
    const [result] = await res.json() as Array<{ tokens: number }>;
    expect(result.tokens).toBe(4500);
  });

  it("derives passCount from testResults array when numPassedTests is absent", async () => {
    mockReaddir.mockResolvedValue(["20260326-120000-openstrux"]);
    mockStat.mockResolvedValue({ isDirectory: () => true });
    mockReadFile
      .mockResolvedValueOnce(JSON.stringify({ totalTokens: 1000, turns: 1, durationMs: 5000 }))
      .mockResolvedValueOnce(JSON.stringify({
        testResults: [
          { status: "passed" },
          { status: "passed" },
          { status: "failed" },
        ],
      }));
    const res = await GET();
    const [result] = await res.json() as Array<{ passCount: number; totalTests: number }>;
    expect(result.passCount).toBe(2);
    expect(result.totalTests).toBe(3);
  });

  it("formats the date field from the slug timestamp", async () => {
    mockReaddir.mockResolvedValue(["20260326-120000-direct"]);
    mockStat.mockResolvedValue({ isDirectory: () => true });
    mockReadFile.mockResolvedValueOnce(VALID_META).mockResolvedValueOnce(VALID_TESTS);
    const res = await GET();
    const [result] = await res.json() as Array<{ date: string; slug: string }>;
    expect(result.date).toBe("2026-03-26T12:00:00Z");
    expect(result.slug).toBe("20260326-120000-direct");
  });
});

describe("GET /api/benchmarks — sorting", () => {
  it("returns results sorted by date descending", async () => {
    mockReaddir.mockResolvedValue([
      "20260101-120000-direct",
      "20260326-120000-direct",
      "20260201-120000-openstrux",
    ]);
    mockStat.mockResolvedValue({ isDirectory: () => true });
    // Each valid result needs 2 readFile calls
    mockReadFile
      .mockResolvedValueOnce(VALID_META).mockResolvedValueOnce(VALID_TESTS)
      .mockResolvedValueOnce(VALID_META).mockResolvedValueOnce(VALID_TESTS)
      .mockResolvedValueOnce(VALID_META).mockResolvedValueOnce(VALID_TESTS);
    const res = await GET();
    const results = await res.json() as Array<{ slug: string }>;
    expect(results.map((r) => r.slug)).toEqual([
      "20260326-120000-direct",
      "20260201-120000-openstrux",
      "20260101-120000-direct",
    ]);
  });
});
