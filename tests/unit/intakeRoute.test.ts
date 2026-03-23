/**
 * Contract tests for POST /api/intake — auth and input validation layer.
 *
 * Tests the route handler's responsibility before the service is called:
 * session verification, role enforcement, and schema validation.
 * No database required.
 *
 * Spec: app/web/src/app/api/intake/route.ts
 *   Auth:   verifySession — role must be "applicant" or "admin"
 *   Body:   IntakeRequestSchema
 *   Codes:  201 created, 400 bad request, 401 unauthenticated, 403 forbidden
 */

import { describe, it, expect } from "vitest";
import { POST } from "../../app/web/src/app/api/intake/route";

function makeReq(headers: Record<string, string>, body: unknown): Request {
  return new Request("http://localhost/api/intake", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
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

const AUTH_APPLICANT = { "x-role": "applicant", "x-user-id": "app-1" };
const AUTH_ADMIN     = { "x-role": "admin",     "x-user-id": "admin-1" };

describe("POST /api/intake — authentication", () => {
  it("returns 401 when no auth headers", async () => {
    const res = await POST(makeReq({}, VALID_BODY) as never);
    expect(res.status).toBe(401);
  });

  it("returns 401 when X-Role header is missing", async () => {
    const res = await POST(makeReq({ "x-user-id": "u1" }, VALID_BODY) as never);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/intake — authorisation", () => {
  it("returns 403 when caller is a reviewer", async () => {
    const res = await POST(makeReq({ "x-role": "reviewer", "x-user-id": "r1" }, VALID_BODY) as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is an auditor", async () => {
    const res = await POST(makeReq({ "x-role": "auditor", "x-user-id": "aud1" }, VALID_BODY) as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is a validator", async () => {
    const res = await POST(makeReq({ "x-role": "validator", "x-user-id": "v1" }, VALID_BODY) as never);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/intake — input validation", () => {
  it("returns 400 when body is missing required fields", async () => {
    const res = await POST(makeReq(AUTH_APPLICANT, { callId: "x" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when requestedBudgetKEur is zero", async () => {
    const res = await POST(makeReq(AUTH_APPLICANT, { ...VALID_BODY, requestedBudgetKEur: 0 }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when requestedBudgetKEur is negative", async () => {
    const res = await POST(makeReq(AUTH_APPLICANT, { ...VALID_BODY, requestedBudgetKEur: -10 }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when title is empty", async () => {
    const res = await POST(makeReq(AUTH_ADMIN, { ...VALID_BODY, title: "" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when callId is missing", async () => {
    const { callId: _, ...noCallId } = VALID_BODY;
    const res = await POST(makeReq(AUTH_APPLICANT, noCallId) as never);
    expect(res.status).toBe(400);
  });
});
