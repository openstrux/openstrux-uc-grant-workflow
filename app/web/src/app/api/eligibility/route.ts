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
 *
 * @generated-stub — replace with real implementation via backend generation
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  void req;
  return NextResponse.json(
    { error: "Backend not yet generated. Apply the backend-generation change first." },
    { status: 501 },
  );
}
