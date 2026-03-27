// prisma/seeds/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEV_USERS = [
  {
    id: "user-applicant-01",
    displayName: "Alice Applicant",
    role: "applicant",
    passwordHash: "$2b$10$placeholder-applicant-hash",
  },
  {
    id: "user-admin-01",
    displayName: "Bob Admin",
    role: "admin",
    passwordHash: "$2b$10$placeholder-admin-hash",
  },
  {
    id: "user-reviewer-01",
    displayName: "Carol Reviewer",
    role: "reviewer",
    passwordHash: "$2b$10$placeholder-reviewer-hash",
  },
  {
    id: "user-validator-01",
    displayName: "David Validator",
    role: "validator",
    passwordHash: "$2b$10$placeholder-validator-hash",
  },
  {
    id: "user-auditor-01",
    displayName: "Eve Auditor",
    role: "auditor",
    passwordHash: "$2b$10$placeholder-auditor-hash",
  },
];

const DEFAULT_CALL = {
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
};

async function main() {
  console.log("Seeding database...");

  // Upsert dev users
  for (const user of DEV_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        displayName: user.displayName,
        role: user.role,
        passwordHash: user.passwordHash,
      },
      create: {
        id: user.id,
        displayName: user.displayName,
        role: user.role,
        passwordHash: user.passwordHash,
      },
    });
    console.log(`  Upserted user: ${user.id} (${user.role})`);
  }

  // Upsert default call
  await prisma.call.upsert({
    where: { id: DEFAULT_CALL.id },
    update: {
      title: DEFAULT_CALL.title,
      description: DEFAULT_CALL.description,
      status: DEFAULT_CALL.status,
      maxBudgetKEur: DEFAULT_CALL.maxBudgetKEur,
      enabledEligibilityChecks: DEFAULT_CALL.enabledEligibilityChecks,
    },
    create: {
      id: DEFAULT_CALL.id,
      title: DEFAULT_CALL.title,
      description: DEFAULT_CALL.description,
      status: DEFAULT_CALL.status,
      maxBudgetKEur: DEFAULT_CALL.maxBudgetKEur,
      enabledEligibilityChecks: DEFAULT_CALL.enabledEligibilityChecks,
    },
  });
  console.log(`  Upserted call: ${DEFAULT_CALL.id}`);

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
