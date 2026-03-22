/**
 * POST /api/intake
 *
 * Receives a new proposal submission. This route is a stub — the backend
 * generation phase must replace this with a real implementation.
 *
 * Contract:
 *   Body: { callId, applicantAlias, title, abstract, requestedBudgetKEur, budgetUsage, tasksBreakdown }
 *   Response 201: { submissionId: string }
 *   Response 400: { error: string }
 *   Response 501: not yet implemented
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
