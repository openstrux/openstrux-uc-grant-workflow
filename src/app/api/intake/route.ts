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
import { verifySession } from "../../../lib/dal";
import { IntakeRequestSchema } from "../../../domain/schemas";
import { submitProposal } from "../.././../server/services/submissionService";

const ALLOWED_ROLES = ["applicant", "admin"] as const;

export async function POST(req: NextRequest) {
  // Auth: verify session first
  const principal = await verifySession(req);
  if (!principal) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(ALLOWED_ROLES as readonly string[]).includes(principal.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = IntakeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.errors },
      { status: 400 },
    );
  }

  // Call service
  const result = await submitProposal(parsed.data);
  return NextResponse.json({ submissionId: result.submissionId }, { status: 201 });
}
