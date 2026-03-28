// src/app/api/intake/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import { IntakeRequestSchema } from "@/domain/schemas";
import { submitProposal } from "@/server/services/submissionService";

export async function POST(req: NextRequest) {
  const principal = await verifySession(req);
  if (!principal) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (principal.role !== "applicant" && principal.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = IntakeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const result = await submitProposal(parsed.data);
  return NextResponse.json({ submissionId: result.submissionId }, { status: 201 });
}
