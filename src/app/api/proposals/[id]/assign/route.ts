/**
 * POST /api/proposals/[id]/assign
 *
 * Assigns a reviewer to a proposal.
 * Auth: admin only.
 *
 * @generated-stub — returns 501; wire to DB via backend generation.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySession } from "@/lib/dal";

const AssignSchema = z.object({ reviewerId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const principal = await verifySession(req);
  if (!principal) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (principal.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = AssignSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
