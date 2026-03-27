// prisma/seeds/seed.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEV_USERS = [
  {
    id: "user-applicant-01",
    displayName: "Alice Applicant",
    role: "applicant" as const,
    passwordHash: "$2b$10$dev-placeholder-not-used",
  },
  {
    id: "user-admin-01",
    displayName: "Bob Admin",
    role: "admin" as const,
    passwordHash: "$2b$10$dev-placeholder-not-used",
  },
  {
    id: "user-reviewer-01",
    displayName: "Carol Reviewer",
    role: "reviewer" as const,
    passwordHash: "$2b$10$dev-placeholder-not-used",
  },
  {
    id: "user-validator-01",
    displayName: "David Validator",
    role: "validator" as const,
    passwordHash: "$2b$10$dev-placeholder-not-used",
  },
  {
    id: "user-auditor-01",
    displayName: "Eve Auditor",
    role: "auditor" as const,
    passwordHash: "$2b$10$dev-placeholder-not-used",
  },
];

async function main() {
  for (const user of DEV_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { displayName: user.displayName, role: user.role },
      create: user,
    });
  }

  await prisma.call.upsert({
    where: { id: "eu-oss-fund-2026" },
    update: {
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
