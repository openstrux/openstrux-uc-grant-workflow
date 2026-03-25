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
  // Auth: verify session
  const principal = await verifySession(req);
  if (!principal) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Authorisation: admin only
  if (principal.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = EligibilityRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 },
    );
  }

  // Run eligibility check
  const result = await runEligibilityCheck(parsed.data);

  return NextResponse.json(result, { status: 200 });
}
