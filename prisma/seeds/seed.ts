import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEV_USERS = [
  { id: "user-applicant-01", displayName: "Alice Applicant", role: "applicant" as const, password: "applicant123" },
  { id: "user-admin-01",     displayName: "Bob Admin",       role: "admin"     as const, password: "admin123" },
  { id: "user-reviewer-01",  displayName: "Carol Reviewer",  role: "reviewer"  as const, password: "reviewer123" },
  { id: "user-validator-01", displayName: "David Validator", role: "validator" as const, password: "validator123" },
  { id: "user-auditor-01",   displayName: "Eve Auditor",     role: "auditor"   as const, password: "auditor123" },
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
    "firstTimeApplicantInProgramme",
  ],
};

async function main() {
  console.log("Seeding database...");

  for (const user of DEV_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { id: user.id },
      update: { displayName: user.displayName, role: user.role, passwordHash },
      create: { id: user.id, displayName: user.displayName, role: user.role, passwordHash },
    });
    console.log(`  Upserted user: ${user.id} (${user.role})`);
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

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
