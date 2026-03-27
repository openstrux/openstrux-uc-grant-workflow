/**
 * GET /api/proposals
 *
 * Returns all submissions visible to the caller.
 * Auth: admin, reviewer, validator, auditor.
 *
 * @generated-stub — returns empty array; wire to DB via backend generation.
 */

import { NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import type { Submission } from "@/domain/schemas";

export type SubmissionSummary = Pick<Submission, "id" | "callId" | "applicantAlias" | "status" | "submittedAt"> & {
  title: string;
};

const ALLOWED_ROLES = new Set(["admin", "reviewer", "validator", "auditor"]);

export async function GET() {
  const principal = await verifySession();
  if (!principal) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!ALLOWED_ROLES.has(principal.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const results: SubmissionSummary[] = [];
  return NextResponse.json(results, { status: 200 });
}
