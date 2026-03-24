/**
 * Data Access Layer — session verification and principal extraction.
 *
 * Contract:
 *   verifySession(req) → Principal | null
 *
 * For P0-P2 (dev mode): reads X-Role and X-User-Id headers.
 * Production: replace with JWT verification.
 *
 * NOTE: add `import "server-only"` in the generated implementation
 * to prevent accidental client-side imports.
 *
 * @generated-stub — replace with real implementation via backend generation
 */

export interface Principal {
  role: "applicant" | "admin" | "reviewer" | "validator" | "auditor";
  userId: string;
}

/**
 * Extract and verify the caller's identity from the request.
 * Returns null if unauthenticated.
 */
export async function verifySession(
  _req: Request,
): Promise<Principal | null> {
  throw new Error("Not implemented — replace via backend generation");
}
