// src/server/services/eligibilityService.ts
/**
 * eligibilityService — eligibility gate evaluation.
 *
 * Orchestrates: evaluate inputs → persist EligibilityRecord →
 * transition Submission status → AuditEvent.
 */

import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { evaluateEligibility } from "../../policies";
import type {
  EligibilityRequest,
  EligibilityResponse,
} from "../../domain/schemas";

const prisma = new PrismaClient();

/** All eligibility checks enabled by default for the demo call. */
const DEFAULT_ACTIVE_RULES = [
  "submittedInEnglish",
  "alignedWithCall",
  "primaryObjectiveIsRd",
  "meetsEuropeanDimension",
  "requestedBudgetKEur",
  "firstTimeApplicantInProgramme",
];

/**
 * Run a full eligibility check: evaluate inputs against the active rule set,
 * persist the EligibilityRecord, transition the submission status, and create
 * an audit event.
 */
export async function runEligibilityCheck(
  request: EligibilityRequest,
): Promise<EligibilityResponse> {
  const { submissionId, inputs } = request;

  // 1. Pure evaluation
  const result = evaluateEligibility(inputs, DEFAULT_ACTIVE_RULES);

  // 2. Derive new submission status
  const newStatus =
    result.status === "eligible" ? "eligible" : "eligibility_failed";

  // 3. Persist EligibilityRecord
  await prisma.eligibilityRecord.create({
    data: {
      submissionId,
      status: result.status,
      inputs: inputs as unknown as Prisma.InputJsonValue,
      activeRules: DEFAULT_ACTIVE_RULES,
      failureReasons: result.failureReasons,
    },
  });

  // 4. Transition Submission status
  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: newStatus },
  });

  // 5. Audit event
  await prisma.auditEvent.create({
    data: {
      eventType: "eligibility.checked",
      actorId: "system",
      targetType: "Submission",
      targetId: submissionId,
      payload: {
        status: result.status,
        failureReasons: result.failureReasons,
      } as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    status: result.status,
    failureReasons: result.failureReasons,
  };
}
