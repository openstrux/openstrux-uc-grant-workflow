/**
 * Contract tests for the Data Access Layer — session verification.
 *
 * Tests verifySession using the P0-P2 dev-mode contract: reads X-Role and
 * X-User-Id headers from the incoming request. No database required.
 *
 * Spec: app/web/src/lib/dal.ts — Principal type and verifySession signature.
 */

import { describe, it, expect } from "vitest";
import { verifySession } from "../../src/lib/dal";

function req(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/test", { headers });
}

describe("verifySession — P0-P2 header-based auth", () => {
  it("returns null when no headers are present", async () => {
    expect(await verifySession(req())).toBeNull();
  });

  it("returns null when X-Role is missing", async () => {
    expect(await verifySession(req({ "x-user-id": "u1" }))).toBeNull();
  });

  it("returns null when X-User-Id is missing", async () => {
    expect(await verifySession(req({ "x-role": "admin" }))).toBeNull();
  });

  it("returns null for an unrecognised role", async () => {
    expect(await verifySession(req({ "x-role": "superuser", "x-user-id": "u1" }))).toBeNull();
  });

  it("returns a Principal for role=admin", async () => {
    const p = await verifySession(req({ "x-role": "admin", "x-user-id": "u1" }));
    expect(p).toEqual({ role: "admin", userId: "u1" });
  });

  it("returns a Principal for role=applicant", async () => {
    const p = await verifySession(req({ "x-role": "applicant", "x-user-id": "a1" }));
    expect(p).toEqual({ role: "applicant", userId: "a1" });
  });

  it("returns a Principal for role=reviewer", async () => {
    const p = await verifySession(req({ "x-role": "reviewer", "x-user-id": "r1" }));
    expect(p).toEqual({ role: "reviewer", userId: "r1" });
  });

  it("returns a Principal for role=auditor", async () => {
    const p = await verifySession(req({ "x-role": "auditor", "x-user-id": "aud1" }));
    expect(p).toEqual({ role: "auditor", userId: "aud1" });
  });
});
