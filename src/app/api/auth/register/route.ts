/**
 * POST /api/auth/register
 *
 * Creates a new applicant account and persists the proposal submission.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/session";
import { RegisterRequestSchema } from "@/domain/schemas";
import { submitProposal } from "@/server/services/submissionService";
import { randomUUID } from "crypto";

// @dev-only — tracks emails registered during the process lifetime (resets on restart)
const REGISTERED_EMAILS = new Set<string>();

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = RegisterRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, firstName, lastName, organisation, country, callId, title, abstract, requestedBudgetKEur, budgetUsage, tasksBreakdown } = parsed.data;

  // @dev-only — duplicate check against in-memory set
  if (REGISTERED_EMAILS.has(email)) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  REGISTERED_EMAILS.add(email);

  const userId = `applicant-${randomUUID()}`;
  // Anonymised alias shown to reviewers — never the real name
  const applicantAlias = `Applicant-${userId.slice(-8)}`;

  // Persist proposal to DB
  const result = await submitProposal(
    {
      callId,
      applicantAlias,
      title,
      abstract,
      requestedBudgetKEur,
      budgetUsage,
      tasksBreakdown,
      legalName: `${firstName} ${lastName}`,
      email,
      country,
      organisation,
    },
    userId,
  );

  // Store submissionId in session so the dashboard can retrieve it
  await createSession(userId, "applicant", result.submissionId);

  return NextResponse.json({ userId, submissionId: result.submissionId }, { status: 201 });
}
