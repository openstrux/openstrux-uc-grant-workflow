// prisma/seeds/seed.ts
// Idempotent seed: upsert canonical dev users and the default Call.
// Per openspec/specs/access-policies.md §Dev fixtures.
// Passwords are placeholder strings — never import bcrypt in this file.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Dev users — one per role
  const users = [
    {
      id: "user-applicant-01",
      displayName: "Alice Applicant",
      role: "applicant",
      passwordHash: "placeholder-applicant123",
    },
    {
      id: "user-admin-01",
      displayName: "Bob Admin",
      role: "admin",
      passwordHash: "placeholder-admin123",
    },
    {
      id: "user-reviewer-01",
      displayName: "Carol Reviewer",
      role: "reviewer",
      passwordHash: "placeholder-reviewer123",
    },
    {
      id: "user-validator-01",
      displayName: "David Validator",
      role: "validator",
      passwordHash: "placeholder-validator123",
    },
    {
      id: "user-auditor-01",
      displayName: "Eve Auditor",
      role: "auditor",
      passwordHash: "placeholder-auditor123",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { displayName: user.displayName, role: user.role },
      create: user,
    });
  }

  // Default Call — all 6 MVP eligibility checks enabled
  await prisma.call.upsert({
    where: { id: "eu-oss-fund-2026" },
    update: {
      enabledEligibilityChecks: [
        "submittedInEnglish",
        "alignedWithCall",
        "primaryObjectiveIsRd",
        "meetsEuropeanDimension",
        "requestedBudgetKEur",
        "firstTimeApplicantInProgramme",
      ],
    },
    create: {
      id: "eu-oss-fund-2026",
      title: "EU Open Source Fund 2026",
      description:
        "Funding for open source software projects with European dimension.",
      status: "open",
      maxBudgetKEur: 500,
      enabledEligibilityChecks: [
        "submittedInEnglish",
        "alignedWithCall",
        "primaryObjectiveIsRd",
        "meetsEuropeanDimension",
        "requestedBudgetKEur",
        "firstTimeApplicantInProgramme",
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
  .finally(async () => {
    await prisma.$disconnect();
  });
