/**
 * POST /api/intake
 *
 * Receives a new proposal submission.
 *
 * Contract:
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
import { IntakeRequestSchema } from "../../../domain/schemas/index";
import { submitProposal } from "../../../server/services/submissionService";

const ALLOWED_ROLES = ["applicant", "admin"] as const;

export async function POST(req: NextRequest) {
  // Auth: verify session
  const principal = await verifySession(req);
  if (!principal) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Authorisation: only applicant or admin
  if (!(ALLOWED_ROLES as readonly string[]).includes(principal.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = IntakeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 },
    );
  }

  // Submit proposal
  const result = await submitProposal(parsed.data);

  return NextResponse.json({ submissionId: result.submissionId }, { status: 201 });
}
