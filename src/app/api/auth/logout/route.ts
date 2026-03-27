/**
 * POST /api/auth/logout
 *
 * Deletes the session cookie and redirects to /.
 */

import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";

export async function POST() {
  await deleteSession();
  return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL ?? "http://localhost:3000"), {
    status: 303,
  });
}
