/**
 * eligibilityService — service-layer implementation for eligibility checks.
 *
 * Orchestrates: evaluate → persist EligibilityRecord → transition status → audit event.
 * All types derive from @grant-workflow/domain schemas.
 */

import type { EligibilityRequest, EligibilityResponse } from "../../domain/schemas";
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { evaluateEligibility } from "../../policies";

const prisma = new PrismaClient();

// Default active rules per openspec/specs/mvp-profile.md
const DEFAULT_ACTIVE_RULES = [
  "submittedInEnglish",
  "alignedWithCall",
  "primaryObjectiveIsRd",
  "meetsEuropeanDimension",
  "requestedBudgetKEur",
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

  // Derive active rules from the submission's call (fall back to defaults)
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { call: true },
  });

  const activeRules =
    submission?.call?.enabledEligibilityChecks?.length
      ? submission.call.enabledEligibilityChecks
      : DEFAULT_ACTIVE_RULES;

  // Evaluate eligibility (pure function)
  const result = evaluateEligibility(inputs, activeRules);

  // Persist eligibility record
  await prisma.eligibilityRecord.create({
    data: {
      submissionId,
      status: result.status,
      inputs: result.inputs as unknown as Prisma.InputJsonValue,
      activeRules,
      failureReasons: result.failureReasons,
    },
  });

  // Transition submission status
  const nextStatus =
    result.status === "eligible" ? "eligible" : "eligibility_failed";

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
      } as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    status: result.status,
    failureReasons: result.failureReasons,
  };
}
