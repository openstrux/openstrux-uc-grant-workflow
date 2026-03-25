/**
 * POST /api/eligibility
 *
 * Runs the eligibility check for a submission.
 *
 * Contract:
 *   Body:         EligibilityRequestSchema
 *   Response 200: EligibilityResponseSchema — { status, failureReasons }
 *   Response 400: { error: string }
 *   Response 401: unauthenticated
 *   Response 403: wrong role
 *
 * Auth: verifySession(req) — must have role "admin".
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "../../../lib/dal";
import { EligibilityRequestSchema } from "../../../domain/schemas/index";
import { runEligibilityCheck } from "../../../server/services/eligibilityService";

export async function POST(req: NextRequest) {
  // 1. Verify session
  const principal = await verifySession(req as unknown as Request);

  if (!principal) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (principal.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = EligibilityRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.message },
      { status: 400 },
    );
  }

  // 3. Call service
  try {
    const result = await runEligibilityCheck(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
