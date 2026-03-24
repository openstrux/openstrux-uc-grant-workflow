/**
 * POST /api/intake
 *
 * Receives a new proposal submission.
 *
 * Contract (defined in @grant-workflow/domain):
 *   Body:         IntakeRequestSchema
 *   Response 201: IntakeResponseSchema  — { submissionId }
 *   Response 400: { error: string }
 *   Response 401: unauthenticated
 *   Response 403: wrong role
 *
 * Auth: verifySession(req) — must have role "applicant" or "admin".
 */

import { NextRequest, NextResponse } from "next/server";
import { IntakeRequestSchema } from "../../../../../../packages/domain/src/schemas";
import { verifySession } from "../../../lib/dal";
import { submitProposal } from "../../../server/services/submissionService";

const ALLOWED_ROLES = ["applicant", "admin"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

function isAllowedRole(role: string): role is AllowedRole {
  return (ALLOWED_ROLES as readonly string[]).includes(role);
}

export async function POST(req: NextRequest) {
  // 1. Verify session — returns null if unauthenticated
  const principal = await verifySession(req);
  if (!principal) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // 2. Authorise — only applicant and admin may submit proposals
  if (!isAllowedRole(principal.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = IntakeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // 4. Submit proposal
  const result = await submitProposal(parsed.data);

  return NextResponse.json({ submissionId: result.submissionId }, { status: 201 });
}
