/**
 * Contract tests for GET /api/audit — audit event log.
 *
 * Tests auth and role enforcement. No database required.
 *
 * Spec: src/app/api/audit/route.ts
 *   Auth:  verifySession — auditor only
 *   Codes: 200 (stub empty array), 401 unauthenticated, 403 forbidden
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../src/lib/dal", () => ({
  verifySession: vi.fn(),
}));

import { GET } from "../../src/app/api/audit/route";
import * as dal from "../../src/lib/dal";

const mockVerify = dal.verifySession as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockVerify.mockReset();
});

describe("GET /api/audit — authentication", () => {
  it("returns 401 when no session", async () => {
    mockVerify.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

describe("GET /api/audit — authorisation (auditor only)", () => {
  it("returns 403 when caller is admin", async () => {
    mockVerify.mockResolvedValue({ userId: "adm1", role: "admin" });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is a reviewer", async () => {
    mockVerify.mockResolvedValue({ userId: "rev1", role: "reviewer" });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is a validator", async () => {
    mockVerify.mockResolvedValue({ userId: "val1", role: "validator" });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns 403 when caller is an applicant", async () => {
    mockVerify.mockResolvedValue({ userId: "a1", role: "applicant" });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns 200 for auditor", async () => {
    mockVerify.mockResolvedValue({ userId: "aud1", role: "auditor" });
    const res = await GET();
    expect(res.status).toBe(200);
  });
});

describe("GET /api/audit — response shape", () => {
  it("returns an array (stub returns empty array)", async () => {
    mockVerify.mockResolvedValue({ userId: "aud1", role: "auditor" });
    const res = await GET();
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
