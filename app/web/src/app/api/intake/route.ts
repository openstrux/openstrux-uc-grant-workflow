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
import { ZodError } from "zod";
import { IntakeRequestSchema } from "../../../../../../packages/domain/src/schemas";
import { verifySession } from "../../../lib/dal";
import { submitProposal } from "../../../server/services/submissionService";

const ALLOWED_ROLES = new Set(["applicant", "admin"]);

export async function POST(req: NextRequest) {
  // Auth: verify session
  const principal = await verifySession(req);
  if (!principal) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!ALLOWED_ROLES.has(principal.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let input;
  try {
    input = IntakeRequestSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: err.errors.map((e) => e.message).join("; ") },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Submit proposal
  try {
    const result = await submitProposal(input);
    return NextResponse.json({ submissionId: result.submissionId }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
