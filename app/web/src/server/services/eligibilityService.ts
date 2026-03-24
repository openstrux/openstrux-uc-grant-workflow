/**
 * eligibilityService — service-layer contract for eligibility checks.
 *
 * Called by the POST /api/eligibility route handler.
 * Orchestrates: evaluate → persist EligibilityRecord → transition status → audit event.
 * All types derive from @grant-workflow/domain schemas.
 */

import type {
  EligibilityRequest,
  EligibilityResponse,
} from "../../../../../packages/domain/src/schemas";
import { prisma } from "../../lib/prisma";
import { evaluateEligibility } from "../../../../../packages/policies/src";

// Default active rules per specs/mvp-profile.md
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

  // Resolve active rules: try to look up Call, fall back to MVP defaults
  let activeRules = DEFAULT_ACTIVE_RULES;
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { callId: true },
  });

  if (submission) {
    const call = await prisma.call.findUnique({
      where: { id: submission.callId },
      select: { enabledEligibilityChecks: true },
    });
    if (call && call.enabledEligibilityChecks.length > 0) {
      activeRules = call.enabledEligibilityChecks;
    }
  }

  // Evaluate eligibility (pure function — no side effects)
  const evalResult = evaluateEligibility(inputs, activeRules);

  // Determine the next submission status
  const nextStatus =
    evalResult.status === "eligible" ? "eligible" : "eligibility_failed";

  // Persist results in a transaction
  await prisma.$transaction(async (tx) => {
    // Create EligibilityRecord
    await tx.eligibilityRecord.create({
      data: {
        submissionId,
        status: evalResult.status,
        inputs: inputs as object,
        activeRules: evalResult.activeRules,
        failureReasons: evalResult.failureReasons,
      },
    });

    // Transition submission status
    await tx.submission.update({
      where: { id: submissionId },
      data: { status: nextStatus },
    });

    // Create audit event
    await tx.auditEvent.create({
      data: {
        eventType: "eligibility.checked",
        actorId: "system",
        targetType: "Submission",
        targetId: submissionId,
        payload: {
          status: evalResult.status,
          failureReasons: evalResult.failureReasons,
          activeRules: evalResult.activeRules,
        },
      },
    });
  });

  return {
    status: evalResult.status,
    failureReasons: evalResult.failureReasons,
  };
}
