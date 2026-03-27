/**
 * Contract tests for POST /api/intake — auth and input validation layer.
 *
 * Tests the route handler's responsibility before the service is called:
 * session verification, role enforcement, and schema validation.
 * No database required.
 *
 * Spec: src/app/api/intake/route.ts
 *   Auth:   verifySession — role must be "applicant" or "admin"
 *   Body:   IntakeRequestSchema
 *   Codes:  501 (stub), 400 bad request, 401 unauthenticated, 403 forbidden
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock dal before importing the route so verifySession is controlled
vi.mock("../../src/lib/dal", () => ({
  verifySession: vi.fn(),
}));

import { POST } from "../../src/app/api/intake/route";
import * as dal from "../../src/lib/dal";

const mockVerify = dal.verifySession as ReturnType<typeof vi.fn>;

function makeReq(body: unknown): Request {
  return new Request("http://localhost/api/intake", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  callId: "eu-oss-fund-2026",
  applicantAlias: "anon-001",
  title: "Privacy-preserving DNS resolver",
  abstract: "A DNS resolver that preserves user privacy.",
  requestedBudgetKEur: 50,
  budgetUsage: "Development (80%), testing (20%).",
  tasksBreakdown: "T1: Core implementation — 3 months.",
};

beforeEach(() => {
  mockVerify.mockReset();
});

describe("POST /api/intake — authentication", () => {
  it("returns 401 when no session", async () => {
    mockVerify.mockResolvedValue(null);
    const res = await POST(makeReq(VALID_BODY) as never);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/intake — authorisation", () => {
  it("returns 403 when caller is a reviewer", async () => {
    mockVerify.mockResolvedValue({ userId: "r1", role: "reviewer" });
    const res = await POST(makeReq(VALID_BODY) as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is an auditor", async () => {
    mockVerify.mockResolvedValue({ userId: "aud1", role: "auditor" });
    const res = await POST(makeReq(VALID_BODY) as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is a validator", async () => {
    mockVerify.mockResolvedValue({ userId: "v1", role: "validator" });
    const res = await POST(makeReq(VALID_BODY) as never);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/intake — input validation", () => {
  beforeEach(() => {
    mockVerify.mockResolvedValue({ userId: "app-1", role: "applicant" });
  });

  it("returns 400 when body is missing required fields", async () => {
    const res = await POST(makeReq({ callId: "x" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when requestedBudgetKEur is zero", async () => {
    const res = await POST(makeReq({ ...VALID_BODY, requestedBudgetKEur: 0 }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when requestedBudgetKEur is negative", async () => {
    const res = await POST(makeReq({ ...VALID_BODY, requestedBudgetKEur: -10 }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when title is empty", async () => {
    const res = await POST(makeReq({ ...VALID_BODY, title: "" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when callId is missing", async () => {
    const { callId: _, ...noCallId } = VALID_BODY;
    const res = await POST(makeReq(noCallId) as never);
    expect(res.status).toBe(400);
  });
});
