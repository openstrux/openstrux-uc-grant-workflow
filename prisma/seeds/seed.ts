// prisma/seeds/seed.ts
// Development seed: default call + dev fixture users.

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed the default funding call
  await prisma.call.upsert({
    where: { id: "eu-oss-fund-2026" },
    update: {},
    create: {
      id: "eu-oss-fund-2026",
      title: "EU Open Source Fund 2026",
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

  // Seed dev fixture users (passwords match hardcoded hashes in login/route.ts)
  const devUsers = [
    {
      id: "dev-applicant-1",
      email: "applicant@example.com",
      role: "applicant",
      displayName: "Dev Applicant",
      password: "applicant123",
    },
    {
      id: "dev-admin-1",
      email: "admin@example.com",
      role: "admin",
      displayName: "Dev Admin",
      password: "admin123",
    },
    {
      id: "dev-reviewer-1",
      email: "reviewer@example.com",
      role: "reviewer",
      displayName: "Dev Reviewer",
      password: "reviewer123",
    },
    {
      id: "dev-validator-1",
      email: "validator@example.com",
      role: "validator",
      displayName: "Dev Validator",
      password: "validator123",
    },
    {
      id: "dev-auditor-1",
      email: "auditor@example.com",
      role: "auditor",
      displayName: "Dev Auditor",
      password: "auditor123",
    },
  ];

  for (const u of devUsers) {
    const passwordHash = await hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        role: u.role,
        displayName: u.displayName,
        passwordHash,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
