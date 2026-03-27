/**
 * Contract tests for POST /api/eligibility — auth and input validation layer.
 *
 * Tests the route handler's responsibility before the service is called:
 * session verification, role enforcement, and schema validation.
 * No database required.
 *
 * Spec: src/app/api/eligibility/route.ts
 *   Auth:   verifySession — role must be "admin"
 *   Body:   EligibilityRequestSchema
 *   Codes:  501 (stub), 400 bad request, 401 unauthenticated, 403 forbidden
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../src/lib/dal", () => ({
  verifySession: vi.fn(),
}));

import { POST } from "../../src/app/api/eligibility/route";
import * as dal from "../../src/lib/dal";

const mockVerify = dal.verifySession as ReturnType<typeof vi.fn>;

function makeReq(body: unknown): Request {
  return new Request("http://localhost/api/eligibility", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_INPUTS = {
  submittedInEnglish: true,
  alignedWithCall: true,
  primaryObjectiveIsRd: true,
  meetsEuropeanDimension: "true",
  requestedBudgetKEur: 50,
  firstTimeApplicantInProgramme: true,
};

const VALID_BODY = { submissionId: "sub-001", inputs: VALID_INPUTS };

beforeEach(() => {
  mockVerify.mockReset();
});

describe("POST /api/eligibility — authentication", () => {
  it("returns 401 when no session", async () => {
    mockVerify.mockResolvedValue(null);
    const res = await POST(makeReq(VALID_BODY) as never);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/eligibility — authorisation (admin only)", () => {
  it("returns 403 when caller is an applicant", async () => {
    mockVerify.mockResolvedValue({ userId: "a1", role: "applicant" });
    const res = await POST(makeReq(VALID_BODY) as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is a reviewer", async () => {
    mockVerify.mockResolvedValue({ userId: "r1", role: "reviewer" });
    const res = await POST(makeReq(VALID_BODY) as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is a validator", async () => {
    mockVerify.mockResolvedValue({ userId: "v1", role: "validator" });
    const res = await POST(makeReq(VALID_BODY) as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is an auditor", async () => {
    mockVerify.mockResolvedValue({ userId: "aud1", role: "auditor" });
    const res = await POST(makeReq(VALID_BODY) as never);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/eligibility — input validation", () => {
  beforeEach(() => {
    mockVerify.mockResolvedValue({ userId: "admin-1", role: "admin" });
  });

  it("returns 400 when submissionId is missing", async () => {
    const res = await POST(makeReq({ inputs: VALID_INPUTS }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when inputs object is missing", async () => {
    const res = await POST(makeReq({ submissionId: "sub-001" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when meetsEuropeanDimension has an invalid value", async () => {
    const res = await POST(makeReq({
      submissionId: "sub-001",
      inputs: { ...VALID_INPUTS, meetsEuropeanDimension: "maybe" },
    }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when submittedInEnglish is not a boolean", async () => {
    const res = await POST(makeReq({
      submissionId: "sub-001",
      inputs: { ...VALID_INPUTS, submittedInEnglish: "yes" },
    }) as never);
    expect(res.status).toBe(400);
  });
});
