/**
 * Contract tests for POST /api/eligibility — auth and input validation layer.
 *
 * Tests the route handler's responsibility before the service is called:
 * session verification, role enforcement, and schema validation.
 * No database required.
 *
 * Spec: app/web/src/app/api/eligibility/route.ts
 *   Auth:   verifySession — role must be "admin"
 *   Body:   EligibilityRequestSchema
 *   Codes:  200 ok, 400 bad request, 401 unauthenticated, 403 forbidden
 */

import { describe, it, expect } from "vitest";
import { POST } from "../../app/web/src/app/api/eligibility/route";

function makeReq(headers: Record<string, string>, body: unknown): Request {
  return new Request("http://localhost/api/eligibility", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
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

const VALID_BODY = {
  submissionId: "sub-001",
  inputs: VALID_INPUTS,
};

const AUTH_ADMIN = { "x-role": "admin", "x-user-id": "admin-1" };

describe("POST /api/eligibility — authentication", () => {
  it("returns 401 when no auth headers", async () => {
    const res = await POST(makeReq({}, VALID_BODY) as never);
    expect(res.status).toBe(401);
  });

  it("returns 401 when X-User-Id header is missing", async () => {
    const res = await POST(makeReq({ "x-role": "admin" }, VALID_BODY) as never);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/eligibility — authorisation (admin only)", () => {
  it("returns 403 when caller is an applicant", async () => {
    const res = await POST(makeReq({ "x-role": "applicant", "x-user-id": "a1" }, VALID_BODY) as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is a reviewer", async () => {
    const res = await POST(makeReq({ "x-role": "reviewer", "x-user-id": "r1" }, VALID_BODY) as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is a validator", async () => {
    const res = await POST(makeReq({ "x-role": "validator", "x-user-id": "v1" }, VALID_BODY) as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is an auditor", async () => {
    const res = await POST(makeReq({ "x-role": "auditor", "x-user-id": "aud1" }, VALID_BODY) as never);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/eligibility — input validation", () => {
  it("returns 400 when submissionId is missing", async () => {
    const res = await POST(makeReq(AUTH_ADMIN, { inputs: VALID_INPUTS }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when inputs object is missing", async () => {
    const res = await POST(makeReq(AUTH_ADMIN, { submissionId: "sub-001" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when meetsEuropeanDimension has an invalid value", async () => {
    const res = await POST(makeReq(AUTH_ADMIN, {
      submissionId: "sub-001",
      inputs: { ...VALID_INPUTS, meetsEuropeanDimension: "maybe" },
    }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when submittedInEnglish is not a boolean", async () => {
    const res = await POST(makeReq(AUTH_ADMIN, {
      submissionId: "sub-001",
      inputs: { ...VALID_INPUTS, submittedInEnglish: "yes" },
    }) as never);
    expect(res.status).toBe(400);
  });
});
