/**
 * POST /api/auth/login
 *
 * Validates email + password against hardcoded dev users.
 * @dev-only — replace with real DB lookup before any production deployment.
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { LoginRequestSchema } from "@/domain/schemas";
import type { Role } from "@/lib/session";

// @dev-only — hardcoded dev users for benchmark phase
const DEV_USERS: Array<{ id: string; email: string; passwordHash: string; role: Role }> = [
  {
    id: "dev-applicant-1",
    email: "applicant@example.com",
    passwordHash: "$2b$10$CyorV7SM1285eupTWtt5Y.hNZLTPjsXF2N4P6A393nAjdQZbbYgva", // "applicant123"
    role: "applicant",
  },
  {
    id: "dev-admin-1",
    email: "admin@example.com",
    passwordHash: "$2b$10$W4Y5wm7OWi8BtupN6StXVuMgmUOFjxOJbc2B1i5Bn8zgJSVXqQBui", // "admin123"
    role: "admin",
  },
  {
    id: "dev-reviewer-1",
    email: "reviewer@example.com",
    passwordHash: "$2b$10$mJopYJvtdjJDF9Cs.kTPQOfJ0.AqQnTrTXTu8sRdR.s21SQCkcbm6", // "reviewer123"
    role: "reviewer",
  },
  {
    id: "dev-validator-1",
    email: "validator@example.com",
    passwordHash: "$2b$10$lBVr7aXKltr/Oi/gIeFr8OHCBQHyJU6qIg2jg99nZjypDHQNT4DfG", // "validator123"
    role: "validator",
  },
  {
    id: "dev-auditor-1",
    email: "auditor@example.com",
    passwordHash: "$2b$10$wwdmteAjZh5lyvpTbehXEOmHd6.apPKp46hSURv0B7QDRpn2qH1Pi", // "auditor123"
    role: "auditor",
  },
];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = LoginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = DEV_USERS.find((u) => u.email === email);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await createSession(user.id, user.role);
  return NextResponse.json({ userId: user.id, role: user.role }, { status: 200 });
}
