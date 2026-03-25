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

const ALLOWED_ROLES = new Set(["applicant", "admin"]);

export async function POST(req: NextRequest) {
  // 1. Verify session
  const principal = await verifySession(req as unknown as Request);

  if (!principal) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (!ALLOWED_ROLES.has(principal.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = IntakeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.message },
      { status: 400 },
    );
  }

  // 3. Call service
  try {
    const result = await submitProposal(parsed.data);
    return NextResponse.json(
      { submissionId: result.submissionId },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
