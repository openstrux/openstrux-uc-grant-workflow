/**
 * Database seed — upserts dev fixture users and the default Call.
 *
 * Users and passwords from openspec/specs/access-policies.md §Dev fixtures.
 * Password hash is a placeholder — verifySession uses X-Role/X-User-Id headers in P0-P2.
 *
 * Run via: pnpm db:seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLACEHOLDER_HASH = "$2b$10$dev-placeholder-not-used";

const USERS = [
  { id: "user-applicant-01", displayName: "Alice Applicant", role: "applicant" as const },
  { id: "user-admin-01",     displayName: "Bob Admin",        role: "admin" as const },
  { id: "user-reviewer-01",  displayName: "Carol Reviewer",   role: "reviewer" as const },
  { id: "user-validator-01", displayName: "David Validator",  role: "validator" as const },
  { id: "user-auditor-01",   displayName: "Eve Auditor",      role: "auditor" as const },
];

async function main() {
  // Upsert users
  for (const user of USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { displayName: user.displayName, role: user.role },
      create: {
        id: user.id,
        displayName: user.displayName,
        role: user.role,
        passwordHash: PLACEHOLDER_HASH,
      },
    });
  }

  // Upsert default Call
  await prisma.call.upsert({
    where: { id: "eu-oss-fund-2026" },
    update: {
      title: "EU Open Source Fund 2026",
      description: "Funding for open source software projects with European dimension.",
      status: "open",
      maxBudgetKEur: 500,
      enabledEligibilityChecks: [
        "submittedInEnglish",
        "alignedWithCall",
        "primaryObjectiveIsRd",
        "meetsEuropeanDimension",
        "requestedBudgetKEur",
      ],
    },
    create: {
      id: "eu-oss-fund-2026",
      title: "EU Open Source Fund 2026",
      description: "Funding for open source software projects with European dimension.",
      status: "open",
      maxBudgetKEur: 500,
      enabledEligibilityChecks: [
        "submittedInEnglish",
        "alignedWithCall",
        "primaryObjectiveIsRd",
        "meetsEuropeanDimension",
        "requestedBudgetKEur",
      ],
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect().catch(() => undefined);
  });
