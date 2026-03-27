/**
 * Contract tests for the Data Access Layer — session verification.
 *
 * Tests verifySession using the session cookie contract:
 * reads from the encrypted JWT session cookie via getSession().
 * No database required.
 *
 * Spec: src/lib/dal.ts — Principal type and verifySession signature.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { verifySession } from "../../src/lib/dal";

// Mock getSession so we can control what the session contains without
// requiring real JWTs or a running Next.js cookie store.
vi.mock("../../src/lib/session", async () => {
  const actual = await vi.importActual<typeof import("../../src/lib/session")>(
    "../../src/lib/session",
  );
  return {
    ...actual,
    getSession: vi.fn(),
  };
});

import * as sessionModule from "../../src/lib/session";

const mockGetSession = sessionModule.getSession as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockGetSession.mockReset();
});

describe("verifySession — session-based auth", () => {
  it("returns null when there is no session", async () => {
    mockGetSession.mockResolvedValue(null);
    expect(await verifySession()).toBeNull();
  });

  it("returns a Principal for role=admin", async () => {
    mockGetSession.mockResolvedValue({ userId: "u1", role: "admin", expiresAt: Date.now() + 1000 });
    expect(await verifySession()).toEqual({ userId: "u1", role: "admin" });
  });

  it("returns a Principal for role=applicant", async () => {
    mockGetSession.mockResolvedValue({ userId: "a1", role: "applicant", expiresAt: Date.now() + 1000 });
    expect(await verifySession()).toEqual({ userId: "a1", role: "applicant" });
  });

  it("returns a Principal for role=reviewer", async () => {
    mockGetSession.mockResolvedValue({ userId: "r1", role: "reviewer", expiresAt: Date.now() + 1000 });
    expect(await verifySession()).toEqual({ userId: "r1", role: "reviewer" });
  });

  it("returns a Principal for role=auditor", async () => {
    mockGetSession.mockResolvedValue({ userId: "aud1", role: "auditor", expiresAt: Date.now() + 1000 });
    expect(await verifySession()).toEqual({ userId: "aud1", role: "auditor" });
  });

  it("returns a Principal for role=validator", async () => {
    mockGetSession.mockResolvedValue({ userId: "v1", role: "validator", expiresAt: Date.now() + 1000 });
    expect(await verifySession()).toEqual({ userId: "v1", role: "validator" });
  });

  it("maps userId and role from session payload", async () => {
    mockGetSession.mockResolvedValue({ userId: "xyz-123", role: "admin", expiresAt: Date.now() + 1000 });
    const principal = await verifySession();
    expect(principal).not.toBeNull();
    expect(principal!.userId).toBe("xyz-123");
    expect(principal!.role).toBe("admin");
  });

  it("ignores a Request argument (for backward compatibility)", async () => {
    mockGetSession.mockResolvedValue({ userId: "u1", role: "admin", expiresAt: Date.now() + 1000 });
    const req = new Request("http://localhost/api/test");
    expect(await verifySession(req)).toEqual({ userId: "u1", role: "admin" });
  });
});
