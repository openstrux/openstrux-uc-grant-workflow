// prisma/seeds/seed.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const SALT_ROUNDS = 10;

  const users = [
    { id: "user-applicant-01", displayName: "Alice Applicant", role: "applicant", password: "applicant123" },
    { id: "user-admin-01",     displayName: "Bob Admin",       role: "admin",     password: "admin123" },
    { id: "user-reviewer-01",  displayName: "Carol Reviewer",  role: "reviewer",  password: "reviewer123" },
    { id: "user-validator-01", displayName: "David Validator", role: "validator", password: "validator123" },
    { id: "user-auditor-01",   displayName: "Eve Auditor",     role: "auditor",   password: "auditor123" },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);
    await prisma.user.upsert({
      where: { id: u.id },
      update: { displayName: u.displayName, role: u.role, passwordHash },
      create: { id: u.id, displayName: u.displayName, role: u.role, passwordHash },
    });
  }

  await prisma.call.upsert({
    where: { id: "eu-oss-fund-2026" },
    update: {},
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
  .finally(() => prisma.$disconnect());
