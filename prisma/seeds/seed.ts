/**
 * Seed script — upserts dev fixture users and default Call.
 * Fully idempotent. Run via: pnpm db:seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;

const USERS = [
  { id: "user-applicant-01", displayName: "Alice Applicant", role: "applicant", password: "applicant123" },
  { id: "user-admin-01",     displayName: "Bob Admin",       role: "admin",     password: "admin123" },
  { id: "user-reviewer-01",  displayName: "Carol Reviewer",  role: "reviewer",  password: "reviewer123" },
  { id: "user-validator-01", displayName: "David Validator", role: "validator", password: "validator123" },
  { id: "user-auditor-01",   displayName: "Eve Auditor",     role: "auditor",   password: "auditor123" },
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
  console.log("Seeding users...");
  for (const user of USERS) {
    const passwordHash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
    await prisma.user.upsert({
      where: { id: user.id },
      update: { displayName: user.displayName, role: user.role, passwordHash },
      create: { id: user.id, displayName: user.displayName, role: user.role, passwordHash },
    });
    console.log(`  Upserted user: ${user.id} (${user.role})`);
  }

  console.log("Seeding default call...");
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
