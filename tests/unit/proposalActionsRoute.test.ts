/**
 * Contract tests for proposal action routes:
 *   POST /api/proposals/[id]/assign   — assign reviewer (admin only)
 *   POST /api/proposals/[id]/review   — submit review (reviewer only)
 *   POST /api/proposals/[id]/validate — submit validation (validator only)
 *
 * Tests auth, role enforcement, and schema validation. No database required.
 * All routes return 501 (stub) when authorised and input is valid.
 *
 * Spec: src/app/api/proposals/[id]/assign/route.ts
 *       src/app/api/proposals/[id]/review/route.ts
 *       src/app/api/proposals/[id]/validate/route.ts
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../src/lib/dal", () => ({
  verifySession: vi.fn(),
}));

import { POST as assignPOST } from "../../src/app/api/proposals/[id]/assign/route";
import { POST as reviewPOST } from "../../src/app/api/proposals/[id]/review/route";
import { POST as validatePOST } from "../../src/app/api/proposals/[id]/validate/route";
import * as dal from "../../src/lib/dal";

const mockVerify = dal.verifySession as ReturnType<typeof vi.fn>;

function makeReq(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockVerify.mockReset();
});

// ---------------------------------------------------------------------------
// POST /api/proposals/[id]/assign
// ---------------------------------------------------------------------------

describe("POST /api/proposals/[id]/assign — authentication", () => {
  it("returns 401 when no session", async () => {
    mockVerify.mockResolvedValue(null);
    const res = await assignPOST(makeReq("http://localhost/api/proposals/sub-1/assign", { reviewerId: "rev-1" }) as never);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/proposals/[id]/assign — authorisation (admin only)", () => {
  it("returns 403 when caller is an applicant", async () => {
    mockVerify.mockResolvedValue({ userId: "a1", role: "applicant" });
    const res = await assignPOST(makeReq("http://localhost/api/proposals/sub-1/assign", { reviewerId: "rev-1" }) as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is a reviewer", async () => {
    mockVerify.mockResolvedValue({ userId: "r1", role: "reviewer" });
    const res = await assignPOST(makeReq("http://localhost/api/proposals/sub-1/assign", { reviewerId: "rev-1" }) as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is a validator", async () => {
    mockVerify.mockResolvedValue({ userId: "v1", role: "validator" });
    const res = await assignPOST(makeReq("http://localhost/api/proposals/sub-1/assign", { reviewerId: "rev-1" }) as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is an auditor", async () => {
    mockVerify.mockResolvedValue({ userId: "aud1", role: "auditor" });
    const res = await assignPOST(makeReq("http://localhost/api/proposals/sub-1/assign", { reviewerId: "rev-1" }) as never);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/proposals/[id]/assign — input validation", () => {
  beforeEach(() => {
    mockVerify.mockResolvedValue({ userId: "adm1", role: "admin" });
  });

  it("returns 400 when reviewerId is missing", async () => {
    const res = await assignPOST(makeReq("http://localhost/api/proposals/sub-1/assign", {}) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when reviewerId is empty string", async () => {
    const res = await assignPOST(makeReq("http://localhost/api/proposals/sub-1/assign", { reviewerId: "" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 501 for valid admin request (stub)", async () => {
    const res = await assignPOST(makeReq("http://localhost/api/proposals/sub-1/assign", { reviewerId: "rev-1" }) as never);
    expect(res.status).toBe(501);
  });
});

// ---------------------------------------------------------------------------
// POST /api/proposals/[id]/review
// ---------------------------------------------------------------------------

describe("POST /api/proposals/[id]/review — authentication", () => {
  it("returns 401 when no session", async () => {
    mockVerify.mockResolvedValue(null);
    const res = await reviewPOST(makeReq("http://localhost/api/proposals/sub-1/review", {
      notes: "Looks good.",
      recommendation: "shortlist",
    }) as never);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/proposals/[id]/review — authorisation (reviewer only)", () => {
  it("returns 403 when caller is admin", async () => {
    mockVerify.mockResolvedValue({ userId: "adm1", role: "admin" });
    const res = await reviewPOST(makeReq("http://localhost/api/proposals/sub-1/review", {
      notes: "Looks good.",
      recommendation: "shortlist",
    }) as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is an applicant", async () => {
    mockVerify.mockResolvedValue({ userId: "a1", role: "applicant" });
    const res = await reviewPOST(makeReq("http://localhost/api/proposals/sub-1/review", {
      notes: "Looks good.",
      recommendation: "shortlist",
    }) as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is a validator", async () => {
    mockVerify.mockResolvedValue({ userId: "v1", role: "validator" });
    const res = await reviewPOST(makeReq("http://localhost/api/proposals/sub-1/review", {
      notes: "Looks good.",
      recommendation: "shortlist",
    }) as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is an auditor", async () => {
    mockVerify.mockResolvedValue({ userId: "aud1", role: "auditor" });
    const res = await reviewPOST(makeReq("http://localhost/api/proposals/sub-1/review", {
      notes: "Looks good.",
      recommendation: "shortlist",
    }) as never);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/proposals/[id]/review — input validation", () => {
  beforeEach(() => {
    mockVerify.mockResolvedValue({ userId: "rev1", role: "reviewer" });
  });

  it("returns 400 when notes is missing", async () => {
    const res = await reviewPOST(makeReq("http://localhost/api/proposals/sub-1/review", {
      recommendation: "shortlist",
    }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when notes is empty", async () => {
    const res = await reviewPOST(makeReq("http://localhost/api/proposals/sub-1/review", {
      notes: "",
      recommendation: "shortlist",
    }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when recommendation has an invalid value", async () => {
    const res = await reviewPOST(makeReq("http://localhost/api/proposals/sub-1/review", {
      notes: "Some notes.",
      recommendation: "approve",
    }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when recommendation is missing", async () => {
    const res = await reviewPOST(makeReq("http://localhost/api/proposals/sub-1/review", {
      notes: "Some notes.",
    }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 501 for valid reviewer request (stub) — shortlist", async () => {
    const res = await reviewPOST(makeReq("http://localhost/api/proposals/sub-1/review", {
      notes: "Well-scoped project.",
      recommendation: "shortlist",
    }) as never);
    expect(res.status).toBe(501);
  });

  it("returns 501 for valid reviewer request (stub) — reject", async () => {
    const res = await reviewPOST(makeReq("http://localhost/api/proposals/sub-1/review", {
      notes: "Out of scope.",
      recommendation: "reject",
    }) as never);
    expect(res.status).toBe(501);
  });

  it("returns 501 for valid reviewer request (stub) — request_clarification", async () => {
    const res = await reviewPOST(makeReq("http://localhost/api/proposals/sub-1/review", {
      notes: "Need budget breakdown.",
      recommendation: "request_clarification",
    }) as never);
    expect(res.status).toBe(501);
  });
});

// ---------------------------------------------------------------------------
// POST /api/proposals/[id]/validate
// ---------------------------------------------------------------------------

describe("POST /api/proposals/[id]/validate — authentication", () => {
  it("returns 401 when no session", async () => {
    mockVerify.mockResolvedValue(null);
    const res = await validatePOST(makeReq("http://localhost/api/proposals/sub-1/validate", {
      decision: "approve",
      notes: "Meets all criteria.",
    }) as never);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/proposals/[id]/validate — authorisation (validator only)", () => {
  it("returns 403 when caller is admin", async () => {
    mockVerify.mockResolvedValue({ userId: "adm1", role: "admin" });
    const res = await validatePOST(makeReq("http://localhost/api/proposals/sub-1/validate", {
      decision: "approve",
      notes: "Meets all criteria.",
    }) as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is a reviewer", async () => {
    mockVerify.mockResolvedValue({ userId: "rev1", role: "reviewer" });
    const res = await validatePOST(makeReq("http://localhost/api/proposals/sub-1/validate", {
      decision: "approve",
      notes: "Meets all criteria.",
    }) as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is an applicant", async () => {
    mockVerify.mockResolvedValue({ userId: "a1", role: "applicant" });
    const res = await validatePOST(makeReq("http://localhost/api/proposals/sub-1/validate", {
      decision: "approve",
      notes: "Meets all criteria.",
    }) as never);
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is an auditor", async () => {
    mockVerify.mockResolvedValue({ userId: "aud1", role: "auditor" });
    const res = await validatePOST(makeReq("http://localhost/api/proposals/sub-1/validate", {
      decision: "approve",
      notes: "Meets all criteria.",
    }) as never);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/proposals/[id]/validate — input validation", () => {
  beforeEach(() => {
    mockVerify.mockResolvedValue({ userId: "val1", role: "validator" });
  });

  it("returns 400 when decision is missing", async () => {
    const res = await validatePOST(makeReq("http://localhost/api/proposals/sub-1/validate", {
      notes: "Meets all criteria.",
    }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when decision has an invalid value", async () => {
    const res = await validatePOST(makeReq("http://localhost/api/proposals/sub-1/validate", {
      decision: "shortlist",
      notes: "Meets all criteria.",
    }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when notes is missing", async () => {
    const res = await validatePOST(makeReq("http://localhost/api/proposals/sub-1/validate", {
      decision: "approve",
    }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when notes is empty", async () => {
    const res = await validatePOST(makeReq("http://localhost/api/proposals/sub-1/validate", {
      decision: "approve",
      notes: "",
    }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 501 for valid validator request (stub) — approve", async () => {
    const res = await validatePOST(makeReq("http://localhost/api/proposals/sub-1/validate", {
      decision: "approve",
      notes: "Meets all grant criteria.",
    }) as never);
    expect(res.status).toBe(501);
  });

  it("returns 501 for valid validator request (stub) — reject", async () => {
    const res = await validatePOST(makeReq("http://localhost/api/proposals/sub-1/validate", {
      decision: "reject",
      notes: "Does not meet minimum budget threshold.",
    }) as never);
    expect(res.status).toBe(501);
  });
});
