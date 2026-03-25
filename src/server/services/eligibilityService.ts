/**
 * eligibilityService — service-layer for eligibility checks.
 *
 * Orchestrates: evaluate → persist EligibilityRecord → transition status → audit event.
 */

import { PrismaClient } from "@prisma/client";
import type { EligibilityRequest, EligibilityResponse } from "../../domain/schemas/index";
import { evaluateEligibility } from "../../policies/index";

const prisma = new PrismaClient();

const DEFAULT_ACTIVE_RULES = [
  "submittedInEnglish",
  "alignedWithCall",
  "primaryObjectiveIsRd",
  "meetsEuropeanDimension",
  "requestedBudgetKEur",
];

/**
 * Run a full eligibility check: evaluate inputs, persist the EligibilityRecord,
 * transition the submission status, and create an audit event.
 */
export async function runEligibilityCheck(
  request: EligibilityRequest,
): Promise<EligibilityResponse> {
  // Derive activeRules from the submission's call config, fall back to defaults
  const submission = await prisma.submission.findUnique({
    where: { id: request.submissionId },
    include: { call: true },
  });

  const activeRules = submission?.call?.enabledEligibilityChecks ?? DEFAULT_ACTIVE_RULES;

  // Evaluate eligibility (pure)
  const result = evaluateEligibility(request.inputs, activeRules);

  // Persist eligibility record
  await prisma.eligibilityRecord.create({
    data: {
      submissionId: request.submissionId,
      status: result.status,
      inputs: {
        submittedInEnglish: request.inputs.submittedInEnglish,
        alignedWithCall: request.inputs.alignedWithCall,
        primaryObjectiveIsRd: request.inputs.primaryObjectiveIsRd,
        meetsEuropeanDimension: request.inputs.meetsEuropeanDimension,
        requestedBudgetKEur: request.inputs.requestedBudgetKEur,
        firstTimeApplicantInProgramme: request.inputs.firstTimeApplicantInProgramme,
      },
      activeRules: result.activeRules,
      failureReasons: result.failureReasons,
    },
  });

  // Transition submission status
  const newStatus = result.status === "eligible" ? "eligible" : "eligibility_failed";
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
      },
    },
  });

  return {
    status: result.status,
    failureReasons: result.failureReasons,
  };
}
