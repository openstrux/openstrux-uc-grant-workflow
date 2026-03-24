/**
 * Data Access Layer — session verification and principal extraction.
 *
 * For P0-P2 (dev mode): reads X-Role and X-User-Id headers.
 * Production: replace with JWT verification.
 */

export interface Principal {
  role: "applicant" | "admin" | "reviewer" | "validator" | "auditor";
  userId: string;
}

const VALID_ROLES = [
  "applicant",
  "admin",
  "reviewer",
  "validator",
  "auditor",
] as const;

type Role = (typeof VALID_ROLES)[number];

function isValidRole(value: string): value is Role {
  return (VALID_ROLES as readonly string[]).includes(value);
}

/**
 * Extract and verify the caller's identity from the request.
 * Returns null if unauthenticated or role is unrecognised.
 */
export async function verifySession(req: Request): Promise<Principal | null> {
  const role = req.headers.get("x-role");
  const userId = req.headers.get("x-user-id");

  if (!role || !userId) {
    return null;
  }

  if (!isValidRole(role)) {
    return null;
  }

  return { role, userId };
}
