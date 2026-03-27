/**
 * GET /api/audit
 *
 * Returns the audit event log.
 * Auth: auditor only.
 *
 * @generated-stub — returns empty array; wire to DB via backend generation.
 */

import { NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import type { AuditEvent } from "@/domain/schemas";

export async function GET() {
  const principal = await verifySession();
  if (!principal) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (principal.role !== "auditor") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const events: AuditEvent[] = [];
  return NextResponse.json(events, { status: 200 });
}
