// src/app/api/eligibility/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import { EligibilityRequestSchema } from "@/domain/schemas";
import { runEligibilityCheck } from "@/server/services/eligibilityService";

export async function POST(req: NextRequest) {
  const principal = await verifySession(req);
  if (!principal) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (principal.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = EligibilityRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const result = await runEligibilityCheck(parsed.data);
  return NextResponse.json(result, { status: 200 });
}
