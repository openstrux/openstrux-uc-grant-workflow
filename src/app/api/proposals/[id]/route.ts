/**
 * GET /api/proposals/[id]
 *
 * Returns a single submission.
 * Auth: admin, reviewer, validator, auditor.
 *
 * @generated-stub — returns null; wire to DB via backend generation.
 */

import { NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import type { Submission, ProposalVersion } from "@/domain/schemas";

export type SubmissionDetail = Submission & {
  effectiveVersion: ProposalVersion | null;
};

const ALLOWED_ROLES = new Set(["admin", "reviewer", "validator", "auditor"]);

export async function GET() {
  const principal = await verifySession();
  if (!principal) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!ALLOWED_ROLES.has(principal.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result: SubmissionDetail | null = null;
  return NextResponse.json(result, { status: 200 });
}
