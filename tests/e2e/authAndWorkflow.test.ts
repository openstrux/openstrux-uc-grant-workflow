/**
 * E2e tests: auth flow and role-gated route access.
 *
 * Tests the complete authentication flow (login → session cookie → protected
 * routes → logout) and validates that each role can only reach its allowed
 * endpoints.
 *
 * Requires: running app at APP_URL (default http://localhost:3000).
 * All tests share a single healthcheck beforeAll; individual test groups
 * log in as the relevant dev-user.
 */

import { describe, it, expect, beforeAll } from "vitest";

const BASE_URL = process.env.APP_URL ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function login(email: string, password: string): Promise<{ cookie: string; status: number; body: unknown }> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const cookie = res.headers.get("set-cookie") ?? "";
  const body = await res.json();
  return { cookie, status: res.status, body };
}

function authHeaders(cookie: string): Record<string, string> {
  return { "Content-Type": "application/json", Cookie: cookie };
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

beforeAll(async () => {
  const health = await fetch(`${BASE_URL}/api/benchmarks`).catch(() => null);
  if (!health) {
    throw new Error("App not running at " + BASE_URL);
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

describe("POST /api/auth/login (e2e)", () => {
  it("returns 400 for invalid request body", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 401 for unknown email", async () => {
    const { status } = await login("nobody@example.com", "anypassword");
    expect(status).toBe(401);
  });

  it("returns 401 for wrong password", async () => {
    const { status } = await login("admin@example.com", "wrongpassword");
    expect(status).toBe(401);
  });

  it("returns 200 with userId and role for valid admin credentials", async () => {
    const { status, body } = await login("admin@example.com", "admin123");
    expect(status).toBe(200);
    const { userId, role } = body as { userId: string; role: string };
    expect(userId).toBe("dev-admin-1");
    expect(role).toBe("admin");
  });

  it("sets a session cookie on successful login", async () => {
    const { cookie } = await login("admin@example.com", "admin123");
    expect(cookie).toContain("session=");
  });

  it("returns 200 for reviewer credentials", async () => {
    const { status, body } = await login("reviewer@example.com", "reviewer123");
    expect(status).toBe(200);
    expect((body as { role: string }).role).toBe("reviewer");
  });

  it("returns 200 for auditor credentials", async () => {
    const { status, body } = await login("auditor@example.com", "auditor123");
    expect(status).toBe(200);
    expect((body as { role: string }).role).toBe("auditor");
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

describe("POST /api/auth/logout (e2e)", () => {
  it("returns 303 redirect", async () => {
    const { cookie } = await login("admin@example.com", "admin123");
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      redirect: "manual",
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(303);
  });
});

// ---------------------------------------------------------------------------
// GET /api/proposals — role gating
// ---------------------------------------------------------------------------

describe("GET /api/proposals (e2e)", () => {
  it("returns 401 without a session", async () => {
    const res = await fetch(`${BASE_URL}/api/proposals`);
    expect(res.status).toBe(401);
  });

  it("returns 403 for applicant role", async () => {
    const { cookie } = await login("applicant@example.com", "applicant123");
    const res = await fetch(`${BASE_URL}/api/proposals`, { headers: authHeaders(cookie) });
    expect(res.status).toBe(403);
  });

  it("returns 200 for admin and response is an array", async () => {
    const { cookie } = await login("admin@example.com", "admin123");
    const res = await fetch(`${BASE_URL}/api/proposals`, { headers: authHeaders(cookie) });
    expect(res.status).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });

  it("returns 200 for reviewer", async () => {
    const { cookie } = await login("reviewer@example.com", "reviewer123");
    const res = await fetch(`${BASE_URL}/api/proposals`, { headers: authHeaders(cookie) });
    expect(res.status).toBe(200);
  });

  it("returns 200 for validator", async () => {
    const { cookie } = await login("validator@example.com", "validator123");
    const res = await fetch(`${BASE_URL}/api/proposals`, { headers: authHeaders(cookie) });
    expect(res.status).toBe(200);
  });

  it("returns 200 for auditor", async () => {
    const { cookie } = await login("auditor@example.com", "auditor123");
    const res = await fetch(`${BASE_URL}/api/proposals`, { headers: authHeaders(cookie) });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// GET /api/audit — auditor only
// ---------------------------------------------------------------------------

describe("GET /api/audit (e2e)", () => {
  it("returns 401 without a session", async () => {
    const res = await fetch(`${BASE_URL}/api/audit`);
    expect(res.status).toBe(401);
  });

  it("returns 403 for admin (not auditor)", async () => {
    const { cookie } = await login("admin@example.com", "admin123");
    const res = await fetch(`${BASE_URL}/api/audit`, { headers: authHeaders(cookie) });
    expect(res.status).toBe(403);
  });

  it("returns 403 for reviewer", async () => {
    const { cookie } = await login("reviewer@example.com", "reviewer123");
    const res = await fetch(`${BASE_URL}/api/audit`, { headers: authHeaders(cookie) });
    expect(res.status).toBe(403);
  });

  it("returns 200 for auditor and response is an array", async () => {
    const { cookie } = await login("auditor@example.com", "auditor123");
    const res = await fetch(`${BASE_URL}/api/audit`, { headers: authHeaders(cookie) });
    expect(res.status).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// POST /api/proposals/[id]/assign — admin only
// ---------------------------------------------------------------------------

describe("POST /api/proposals/[id]/assign (e2e)", () => {
  it("returns 401 without a session", async () => {
    const res = await fetch(`${BASE_URL}/api/proposals/sub-001/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewerId: "rev-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 for reviewer", async () => {
    const { cookie } = await login("reviewer@example.com", "reviewer123");
    const res = await fetch(`${BASE_URL}/api/proposals/sub-001/assign`, {
      method: "POST",
      headers: authHeaders(cookie),
      body: JSON.stringify({ reviewerId: "rev-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 400 for admin with missing reviewerId", async () => {
    const { cookie } = await login("admin@example.com", "admin123");
    const res = await fetch(`${BASE_URL}/api/proposals/sub-001/assign`, {
      method: "POST",
      headers: authHeaders(cookie),
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("returns 501 for valid admin request (stub)", async () => {
    const { cookie } = await login("admin@example.com", "admin123");
    const res = await fetch(`${BASE_URL}/api/proposals/sub-001/assign`, {
      method: "POST",
      headers: authHeaders(cookie),
      body: JSON.stringify({ reviewerId: "dev-reviewer-1" }),
    });
    expect(res.status).toBe(501);
  });
});

// ---------------------------------------------------------------------------
// POST /api/proposals/[id]/review — reviewer only
// ---------------------------------------------------------------------------

describe("POST /api/proposals/[id]/review (e2e)", () => {
  it("returns 401 without a session", async () => {
    const res = await fetch(`${BASE_URL}/api/proposals/sub-001/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: "Good.", recommendation: "shortlist" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 for admin (not reviewer)", async () => {
    const { cookie } = await login("admin@example.com", "admin123");
    const res = await fetch(`${BASE_URL}/api/proposals/sub-001/review`, {
      method: "POST",
      headers: authHeaders(cookie),
      body: JSON.stringify({ notes: "Good.", recommendation: "shortlist" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 400 for reviewer with invalid recommendation", async () => {
    const { cookie } = await login("reviewer@example.com", "reviewer123");
    const res = await fetch(`${BASE_URL}/api/proposals/sub-001/review`, {
      method: "POST",
      headers: authHeaders(cookie),
      body: JSON.stringify({ notes: "Good.", recommendation: "approve" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 501 for valid reviewer request (stub)", async () => {
    const { cookie } = await login("reviewer@example.com", "reviewer123");
    const res = await fetch(`${BASE_URL}/api/proposals/sub-001/review`, {
      method: "POST",
      headers: authHeaders(cookie),
      body: JSON.stringify({ notes: "Well-scoped project.", recommendation: "shortlist" }),
    });
    expect(res.status).toBe(501);
  });
});

// ---------------------------------------------------------------------------
// POST /api/proposals/[id]/validate — validator only
// ---------------------------------------------------------------------------

describe("POST /api/proposals/[id]/validate (e2e)", () => {
  it("returns 401 without a session", async () => {
    const res = await fetch(`${BASE_URL}/api/proposals/sub-001/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "approve", notes: "Meets criteria." }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 for reviewer (not validator)", async () => {
    const { cookie } = await login("reviewer@example.com", "reviewer123");
    const res = await fetch(`${BASE_URL}/api/proposals/sub-001/validate`, {
      method: "POST",
      headers: authHeaders(cookie),
      body: JSON.stringify({ decision: "approve", notes: "Meets criteria." }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 400 for validator with invalid decision", async () => {
    const { cookie } = await login("validator@example.com", "validator123");
    const res = await fetch(`${BASE_URL}/api/proposals/sub-001/validate`, {
      method: "POST",
      headers: authHeaders(cookie),
      body: JSON.stringify({ decision: "shortlist", notes: "Meets criteria." }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 501 for valid validator request (stub)", async () => {
    const { cookie } = await login("validator@example.com", "validator123");
    const res = await fetch(`${BASE_URL}/api/proposals/sub-001/validate`, {
      method: "POST",
      headers: authHeaders(cookie),
      body: JSON.stringify({ decision: "approve", notes: "Meets all grant criteria." }),
    });
    expect(res.status).toBe(501);
  });
});

// ---------------------------------------------------------------------------
// GET /api/benchmarks — public
// ---------------------------------------------------------------------------

describe("GET /api/benchmarks (e2e)", () => {
  it("returns 200 without authentication", async () => {
    const res = await fetch(`${BASE_URL}/api/benchmarks`);
    expect(res.status).toBe(200);
  });

  it("returns an array", async () => {
    const res = await fetch(`${BASE_URL}/api/benchmarks`);
    expect(Array.isArray(await res.json())).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

describe("POST /api/auth/register (e2e)", () => {
  it("returns 400 for invalid body", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bad" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 201 with userId and submissionId for valid registration", async () => {
    const uniqueEmail = `e2e-${Date.now()}@example.com`;
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Bob",
        lastName: "Tester",
        email: uniqueEmail,
        organisation: "Test Org",
        country: "DE",
        callId: "eu-oss-fund-2026",
        title: "E2E Registration Test",
        abstract: "Testing registration end-to-end.",
        requestedBudgetKEur: 20,
        budgetUsage: "Development.",
        tasksBreakdown: "T1: Build.",
        password: "testpassword",
        privacyPolicy: true,
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { userId: string; submissionId: string };
    expect(body.userId).toBeTruthy();
    expect(body.submissionId).toBeTruthy();
  });

  it("returns 409 for duplicate email", async () => {
    const uniqueEmail = `e2e-dup-${Date.now()}@example.com`;
    const body = {
      firstName: "Bob",
      lastName: "Tester",
      email: uniqueEmail,
      organisation: "Test Org",
      country: "DE",
      callId: "eu-oss-fund-2026",
      title: "Duplicate Test",
      abstract: "Testing duplicate email rejection.",
      requestedBudgetKEur: 20,
      budgetUsage: "Development.",
      tasksBreakdown: "T1: Build.",
      password: "testpassword",
      privacyPolicy: true,
    };
    const headers = { "Content-Type": "application/json" };
    await fetch(`${BASE_URL}/api/auth/register`, { method: "POST", headers, body: JSON.stringify(body) });
    const second = await fetch(`${BASE_URL}/api/auth/register`, { method: "POST", headers, body: JSON.stringify(body) });
    expect(second.status).toBe(409);
  });
});
