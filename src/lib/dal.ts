import "server-only";

import { getSession } from "./session";

export interface Principal {
  role: "applicant" | "admin" | "reviewer" | "validator" | "auditor";
  userId: string;
}

/**
 * Extract and verify the caller's identity from the session cookie.
 * Returns null if unauthenticated or session is invalid.
 */
export async function verifySession(_req?: Request): Promise<Principal | null> {
  const session = await getSession();
  if (!session) return null;
  return { userId: session.userId, role: session.role };
}
