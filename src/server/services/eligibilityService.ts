/**
 * eligibilityService — eligibility check implementation.
 *
 * Called by the POST /api/eligibility route handler.
 * Orchestrates: evaluate → persist EligibilityRecord → transition status → audit event.
 * All types derive from @grant-workflow/domain schemas.
 */

import { prisma } from "../../lib/prisma";
import { evaluateEligibility } from "../../policies";
import type {
  EligibilityRequest,
  EligibilityResponse,
} from "../../domain/schemas";
import type { InputJsonValue } from "@prisma/client/runtime/library";

// Default active rule set from MVP profile (openspec/specs/mvp-profile.md)
const DEFAULT_ACTIVE_RULES = [
  "submittedInEnglish",
  "alignedWithCall",
  "primaryObjectiveIsRd",
  "meetsEuropeanDimension",
  "requestedBudgetKEur",
  "firstTimeApplicantInProgramme",
];

/**
 * Run a full eligibility check: evaluate inputs against the call's active
 * rule set, persist the EligibilityRecord, transition the submission status,
 * and create an audit event.
 */
export async function runEligibilityCheck(
  request: EligibilityRequest,
): Promise<EligibilityResponse> {
  const result = evaluateEligibility(request.inputs, DEFAULT_ACTIVE_RULES);
  const newStatus =
    result.status === "eligible" ? "eligible" : "eligibility_failed";

  // Persist eligibility record
  await prisma.eligibilityRecord.create({
    data: {
      submissionId: request.submissionId,
      status: newStatus,
      inputs: request.inputs as unknown as InputJsonValue,
      activeRules: result.activeRules as unknown as InputJsonValue,
      failureReasons: result.failureReasons as unknown as InputJsonValue,
    },
  });

  // Update submission status
  await prisma.submission.update({
    where: { id: request.submissionId },
    data: { status: newStatus },
  });

  // Audit event
  await prisma.auditEvent.create({
    data: {
      eventType: "eligibility.checked",
      actorId: "system",
      targetType: "Submission",
      targetId: request.submissionId,
      payload: {
        status: newStatus,
        failureReasons: result.failureReasons,
      } as unknown as InputJsonValue,
    },
  });

  return {
    status: result.status,
    failureReasons: result.failureReasons,
  };
}
