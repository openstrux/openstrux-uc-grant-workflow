/**
 * POST /api/auth/register
 *
 * Creates a new applicant account and submission.
 * @dev-only — uses in-memory duplicate check; no real DB write in stub phase.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/session";
import { RegisterRequestSchema } from "@/domain/schemas";
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

  const { email } = parsed.data;

  // @dev-only — duplicate check against in-memory set
  if (REGISTERED_EMAILS.has(email)) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  REGISTERED_EMAILS.add(email);

  const userId = `applicant-${randomUUID()}`;
  const submissionId = `sub-${randomUUID()}`;

  await createSession(userId, "applicant");
  return NextResponse.json({ userId, submissionId }, { status: 201 });
}
