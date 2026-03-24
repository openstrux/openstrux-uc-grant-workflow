/**
 * POST /api/eligibility
 *
 * Runs the eligibility check for a submission.
 *
 * Contract (defined in @grant-workflow/domain):
 *   Body:         EligibilityRequestSchema
 *   Response 200: EligibilityResponseSchema — { status, failureReasons }
 *   Response 400: { error: string }
 *   Response 401: unauthenticated
 *   Response 403: wrong role
 *
 * Auth: verifySession(req) — must have role "admin".
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { EligibilityRequestSchema } from "../../../../../../packages/domain/src/schemas";
import { verifySession } from "../../../lib/dal";
import { runEligibilityCheck } from "../../../server/services/eligibilityService";

export async function POST(req: NextRequest) {
  // Auth: verify session
  const principal = await verifySession(req);
  if (!principal) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
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

  let input;
  try {
    input = EligibilityRequestSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: err.errors.map((e) => e.message).join("; ") },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Run eligibility check
  try {
    const result = await runEligibilityCheck(input);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
