/**
 * Contract tests for auth routes:
 *   POST /api/auth/login   — credential validation, bcrypt check, session creation
 *   POST /api/auth/logout  — session deletion and redirect
 *   POST /api/auth/register — schema validation, duplicate detection, session creation
 *
 * createSession / deleteSession are mocked so no SESSION_SECRET env var is needed.
 * bcryptjs is mocked to keep tests fast and deterministic.
 * No database required.
 *
 * Spec: src/app/api/auth/login/route.ts
 *       src/app/api/auth/logout/route.ts
 *       src/app/api/auth/register/route.ts
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../src/lib/session", () => ({
  createSession: vi.fn().mockResolvedValue(undefined),
  deleteSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
}));

// Register now calls submitProposal — mock it so tests stay DB-free
vi.mock("../../src/server/services/submissionService", () => ({
  submitProposal: vi.fn().mockResolvedValue({ submissionId: "sub-mock", status: "submitted" }),
}));

import { POST as loginPOST } from "../../src/app/api/auth/login/route";
import { POST as logoutPOST } from "../../src/app/api/auth/logout/route";
import { POST as registerPOST } from "../../src/app/api/auth/register/route";
import * as sessionModule from "../../src/lib/session";
import bcrypt from "bcryptjs";

const mockCreateSession = sessionModule.createSession as ReturnType<typeof vi.fn>;
const mockDeleteSession = sessionModule.deleteSession as ReturnType<typeof vi.fn>;
const mockBcryptCompare = (bcrypt as unknown as { compare: ReturnType<typeof vi.fn> }).compare;

function makeLoginReq(body: unknown): Request {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeRegisterReq(body: unknown): Request {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

let emailCounter = 0;
function uniqueEmail() {
  return `test-${++emailCounter}-${Date.now()}@example.com`;
}

const VALID_REGISTER_BODY = () => ({
  firstName: "Alice",
  lastName: "Smith",
  email: uniqueEmail(),
  organisation: "Acme",
  country: "FR",
  callId: "eu-oss-fund-2026",
  title: "My proposal",
  abstract: "An interesting project.",
  requestedBudgetKEur: 30,
  budgetUsage: "Dev 100%.",
  tasksBreakdown: "T1: Core work.",
  password: "securepass",
  privacyPolicy: true as const,
});

beforeEach(() => {
  mockCreateSession.mockReset().mockResolvedValue(undefined);
  mockDeleteSession.mockReset().mockResolvedValue(undefined);
  mockBcryptCompare.mockReset();
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

describe("POST /api/auth/login — input validation", () => {
  it("returns 400 when body is empty", async () => {
    const res = await loginPOST(makeLoginReq({}) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when email is missing", async () => {
    const res = await loginPOST(makeLoginReq({ password: "abc" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when password is missing", async () => {
    const res = await loginPOST(makeLoginReq({ email: "user@example.com" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when email format is invalid", async () => {
    const res = await loginPOST(makeLoginReq({ email: "not-an-email", password: "secret" }) as never);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login — credential validation", () => {
  it("returns 401 when email is not registered", async () => {
    const res = await loginPOST(makeLoginReq({ email: "nobody@example.com", password: "pass" }) as never);
    expect(res.status).toBe(401);
  });

  it("returns 401 when password is incorrect", async () => {
    mockBcryptCompare.mockResolvedValue(false);
    const res = await loginPOST(makeLoginReq({ email: "admin@example.com", password: "wrongpass" }) as never);
    expect(res.status).toBe(401);
  });

  it("returns 200 with userId and role on valid credentials", async () => {
    mockBcryptCompare.mockResolvedValue(true);
    const res = await loginPOST(makeLoginReq({ email: "admin@example.com", password: "admin123" }) as never);
    expect(res.status).toBe(200);
    const body = await res.json() as { userId: string; role: string };
    expect(body.userId).toBe("dev-admin-1");
    expect(body.role).toBe("admin");
  });

  it("calls createSession on successful login", async () => {
    mockBcryptCompare.mockResolvedValue(true);
    await loginPOST(makeLoginReq({ email: "applicant@example.com", password: "applicant123" }) as never);
    expect(mockCreateSession).toHaveBeenCalledOnce();
    expect(mockCreateSession).toHaveBeenCalledWith("dev-applicant-1", "applicant");
  });

  it("does not call createSession on failed login", async () => {
    mockBcryptCompare.mockResolvedValue(false);
    await loginPOST(makeLoginReq({ email: "admin@example.com", password: "wrong" }) as never);
    expect(mockCreateSession).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

describe("POST /api/auth/logout", () => {
  it("returns 303 redirect", async () => {
    const res = await logoutPOST();
    expect(res.status).toBe(303);
  });

  it("calls deleteSession", async () => {
    await logoutPOST();
    expect(mockDeleteSession).toHaveBeenCalledOnce();
  });

  it("redirects to /", async () => {
    const res = await logoutPOST();
    const location = res.headers.get("location");
    expect(location).toMatch(/\/$/);
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

describe("POST /api/auth/register — input validation", () => {
  it("returns 400 when body is empty", async () => {
    const res = await registerPOST(makeRegisterReq({}) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when email is invalid", async () => {
    const res = await registerPOST(makeRegisterReq({ ...VALID_REGISTER_BODY(), email: "bad-email" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when password is too short", async () => {
    const res = await registerPOST(makeRegisterReq({ ...VALID_REGISTER_BODY(), password: "short" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when requestedBudgetKEur is zero", async () => {
    const res = await registerPOST(makeRegisterReq({ ...VALID_REGISTER_BODY(), requestedBudgetKEur: 0 }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when privacyPolicy is false", async () => {
    const res = await registerPOST(makeRegisterReq({ ...VALID_REGISTER_BODY(), privacyPolicy: false }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when required fields are missing", async () => {
    const { firstName: _, ...noFirstName } = VALID_REGISTER_BODY();
    const res = await registerPOST(makeRegisterReq(noFirstName) as never);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/register — success", () => {
  it("returns 201 with userId and submissionId", async () => {
    const res = await registerPOST(makeRegisterReq(VALID_REGISTER_BODY()) as never);
    expect(res.status).toBe(201);
    const body = await res.json() as { userId: string; submissionId: string };
    expect(body.userId).toBeTruthy();
    expect(body.submissionId).toBeTruthy();
  });

  it("calls createSession with applicant role", async () => {
    await registerPOST(makeRegisterReq(VALID_REGISTER_BODY()) as never);
    expect(mockCreateSession).toHaveBeenCalledOnce();
    const [, role] = mockCreateSession.mock.calls[0] as [string, string];
    expect(role).toBe("applicant");
  });
});

describe("POST /api/auth/register — duplicate detection", () => {
  it("returns 409 when email is already registered", async () => {
    const body = VALID_REGISTER_BODY();
    // First registration succeeds
    const first = await registerPOST(makeRegisterReq(body) as never);
    expect(first.status).toBe(201);
    // Second with same email is rejected
    const second = await registerPOST(makeRegisterReq(body) as never);
    expect(second.status).toBe(409);
  });
});
