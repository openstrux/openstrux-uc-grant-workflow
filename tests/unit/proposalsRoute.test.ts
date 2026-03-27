/**
 * Contract tests for proposal list routes:
 *   GET /api/proposals      — list all submissions
 *   GET /api/proposals/[id] — get single submission
 *
 * Tests auth and role enforcement. No database required.
 *
 * Spec: src/app/api/proposals/route.ts
 *       src/app/api/proposals/[id]/route.ts
 *   Auth:  verifySession — admin | reviewer | validator | auditor
 *   Codes: 200 (stub array/null), 401 unauthenticated, 403 forbidden
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../src/lib/dal", () => ({
  verifySession: vi.fn(),
}));

import { GET as proposalsGET } from "../../src/app/api/proposals/route";
import { GET as proposalByIdGET } from "../../src/app/api/proposals/[id]/route";
import * as dal from "../../src/lib/dal";

const mockVerify = dal.verifySession as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockVerify.mockReset();
});

// ---------------------------------------------------------------------------
// GET /api/proposals
// ---------------------------------------------------------------------------

describe("GET /api/proposals — authentication", () => {
  it("returns 401 when no session", async () => {
    mockVerify.mockResolvedValue(null);
    const res = await proposalsGET();
    expect(res.status).toBe(401);
  });
});

describe("GET /api/proposals — authorisation", () => {
  it("returns 403 when caller is an applicant", async () => {
    mockVerify.mockResolvedValue({ userId: "a1", role: "applicant" });
    const res = await proposalsGET();
    expect(res.status).toBe(403);
  });

  it("returns 200 for admin", async () => {
    mockVerify.mockResolvedValue({ userId: "adm1", role: "admin" });
    const res = await proposalsGET();
    expect(res.status).toBe(200);
  });

  it("returns 200 for reviewer", async () => {
    mockVerify.mockResolvedValue({ userId: "rev1", role: "reviewer" });
    const res = await proposalsGET();
    expect(res.status).toBe(200);
  });

  it("returns 200 for validator", async () => {
    mockVerify.mockResolvedValue({ userId: "val1", role: "validator" });
    const res = await proposalsGET();
    expect(res.status).toBe(200);
  });

  it("returns 200 for auditor", async () => {
    mockVerify.mockResolvedValue({ userId: "aud1", role: "auditor" });
    const res = await proposalsGET();
    expect(res.status).toBe(200);
  });
});

describe("GET /api/proposals — response shape", () => {
  it("returns an array (stub returns empty array)", async () => {
    mockVerify.mockResolvedValue({ userId: "adm1", role: "admin" });
    const res = await proposalsGET();
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// GET /api/proposals/[id]
// ---------------------------------------------------------------------------

describe("GET /api/proposals/[id] — authentication", () => {
  it("returns 401 when no session", async () => {
    mockVerify.mockResolvedValue(null);
    const res = await proposalByIdGET();
    expect(res.status).toBe(401);
  });
});

describe("GET /api/proposals/[id] — authorisation", () => {
  it("returns 403 when caller is an applicant", async () => {
    mockVerify.mockResolvedValue({ userId: "a1", role: "applicant" });
    const res = await proposalByIdGET();
    expect(res.status).toBe(403);
  });

  it("returns 200 for admin", async () => {
    mockVerify.mockResolvedValue({ userId: "adm1", role: "admin" });
    const res = await proposalByIdGET();
    expect(res.status).toBe(200);
  });

  it("returns 200 for reviewer", async () => {
    mockVerify.mockResolvedValue({ userId: "rev1", role: "reviewer" });
    const res = await proposalByIdGET();
    expect(res.status).toBe(200);
  });

  it("returns 200 for validator", async () => {
    mockVerify.mockResolvedValue({ userId: "val1", role: "validator" });
    const res = await proposalByIdGET();
    expect(res.status).toBe(200);
  });

  it("returns 200 for auditor", async () => {
    mockVerify.mockResolvedValue({ userId: "aud1", role: "auditor" });
    const res = await proposalByIdGET();
    expect(res.status).toBe(200);
  });
});
