/**
 * eligibilityService — service-layer implementation for eligibility checks.
 *
 * Orchestrates: evaluate → persist EligibilityRecord → transition status → audit event.
 * Falls back to MVP_DEFAULT_RULES if the Call record is not found.
 */

import type { EligibilityRequest, EligibilityResponse } from "../../domain/schemas";
import { prisma } from "../../lib/prisma";
import { evaluateEligibility } from "../../policies";

const MVP_DEFAULT_RULES = [
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
  // Derive active rules from Call config, fall back to MVP defaults
  let activeRules = MVP_DEFAULT_RULES;

  const submission = await prisma.submission.findUnique({
    where: { id: request.submissionId },
  });
  if (submission) {
    const call = await prisma.call.findUnique({
      where: { id: submission.callId },
    });
    if (call && call.enabledEligibilityChecks.length > 0) {
      activeRules = call.enabledEligibilityChecks;
    }
  }

  // Evaluate eligibility (pure function)
  const result = evaluateEligibility(request.inputs, activeRules);
  const newStatus = result.status === "eligible" ? "eligible" : "eligibility_failed";

  // Persist EligibilityRecord
  await prisma.eligibilityRecord.create({
    data: {
      submissionId: request.submissionId,
      status: result.status,
      inputs: result.inputs as Parameters<
        typeof prisma.eligibilityRecord.create
      >[0]["data"]["inputs"],
      activeRules: result.activeRules,
      failureReasons: result.failureReasons,
    },
  });

  // Transition submission status
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
        status: result.status,
        failureReasons: result.failureReasons,
      } as Parameters<typeof prisma.auditEvent.create>[0]["data"]["payload"],
    },
  });

  return {
    status: result.status,
    failureReasons: result.failureReasons,
  };
}
