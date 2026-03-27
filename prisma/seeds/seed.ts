/**
 * Database seed — upserts dev users and the default Call.
 * Idempotent (uses upsert).
 * Do NOT import bcrypt — passwordHash is a placeholder never read by the app.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEV_PASSWORD_PLACEHOLDER = "$2b$10$dev-placeholder-not-used";

const DEV_USERS = [
  {
    id: "user-applicant-01",
    displayName: "Alice Applicant",
    role: "applicant",
    passwordHash: DEV_PASSWORD_PLACEHOLDER,
  },
  {
    id: "user-admin-01",
    displayName: "Bob Admin",
    role: "admin",
    passwordHash: DEV_PASSWORD_PLACEHOLDER,
  },
  {
    id: "user-reviewer-01",
    displayName: "Carol Reviewer",
    role: "reviewer",
    passwordHash: DEV_PASSWORD_PLACEHOLDER,
  },
  {
    id: "user-validator-01",
    displayName: "David Validator",
    role: "validator",
    passwordHash: DEV_PASSWORD_PLACEHOLDER,
  },
  {
    id: "user-auditor-01",
    displayName: "Eve Auditor",
    role: "auditor",
    passwordHash: DEV_PASSWORD_PLACEHOLDER,
  },
];

const DEFAULT_CALL = {
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
};

async function main() {
  for (const user of DEV_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        displayName: user.displayName,
        role: user.role,
        passwordHash: user.passwordHash,
      },
      create: user,
    });
  }

  await prisma.call.upsert({
    where: { id: DEFAULT_CALL.id },
    update: {
      title: DEFAULT_CALL.title,
      description: DEFAULT_CALL.description,
      status: DEFAULT_CALL.status,
      maxBudgetKEur: DEFAULT_CALL.maxBudgetKEur,
      enabledEligibilityChecks: DEFAULT_CALL.enabledEligibilityChecks,
    },
    create: DEFAULT_CALL,
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
