// src/server/services/eligibilityService.ts
import type {
  EligibilityRequest,
  EligibilityResponse,
} from "../../domain/schemas";
import { prisma } from "../../lib/prisma";
import { evaluateEligibility, getNextStatus } from "../../policies";

/** Default rule set used when call configuration is unavailable */
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
  const { submissionId, inputs } = request;

  // Derive active rules from call configuration, fall back to MVP defaults
  let activeRules: string[] = MVP_DEFAULT_RULES;

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { callId: true },
  });

  if (submission?.callId) {
    const call = await prisma.call.findUnique({
      where: { id: submission.callId },
      select: { enabledEligibilityChecks: true },
    });
    if (call?.enabledEligibilityChecks && call.enabledEligibilityChecks.length > 0) {
      activeRules = call.enabledEligibilityChecks;
    }
  }

  // Evaluate eligibility (pure function)
  const result = evaluateEligibility(inputs, activeRules);
  const nextStatus = getNextStatus(
    "submitted",
    result.status === "eligible" ? "eligibility_pass" : "eligibility_fail",
  );

  // Persist eligibility record
  await prisma.eligibilityRecord.create({
    data: {
      submissionId,
      status: result.status === "eligible" ? "eligible" : "eligibility_failed",
      inputs: JSON.parse(JSON.stringify(inputs)),
      activeRules: result.activeRules,
      failureReasons: result.failureReasons,
    },
  });

  // Transition submission status
  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: nextStatus },
  });

  // Create audit event
  await prisma.auditEvent.create({
    data: {
      eventType: "eligibility.checked",
      actorId: "system",
      targetType: "Submission",
      targetId: submissionId,
      payload: {
        status: result.status,
        failureReasons: result.failureReasons,
        activeRules: result.activeRules,
      },
    },
  });

  return {
    status: result.status === "eligible" ? "eligible" : "ineligible",
    failureReasons: result.failureReasons,
  };
}
