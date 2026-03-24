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
