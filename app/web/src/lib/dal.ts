/**
 * Data Access Layer — session verification and principal extraction.
 *
 * Contract:
 *   verifySession(req) → Principal | null
 *
 * For P0-P2 (dev mode): reads X-Role and X-User-Id headers.
 * Production: replace with JWT verification.
 */

export interface Principal {
  role: "applicant" | "admin" | "reviewer" | "validator" | "auditor";
  userId: string;
}

const VALID_ROLES: Principal["role"][] = [
  "applicant",
  "admin",
  "reviewer",
  "validator",
  "auditor",
];

/**
 * Extract and verify the caller's identity from the request.
 * Returns null if unauthenticated.
 */
export async function verifySession(
  req: Request,
): Promise<Principal | null> {
  const role = req.headers.get("x-role");
  const userId = req.headers.get("x-user-id");

  if (!role || !userId) {
    return null;
  }

  if (!(VALID_ROLES as string[]).includes(role)) {
    return null;
  }

  return {
    role: role as Principal["role"],
    userId,
  };
}
