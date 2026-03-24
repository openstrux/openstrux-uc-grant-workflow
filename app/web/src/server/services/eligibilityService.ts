/**
 * eligibilityService — service-layer contract for eligibility checks.
 *
 * Called by the POST /api/eligibility route handler.
 * Orchestrates: evaluate → persist EligibilityRecord → transition status → audit event.
 * All types derive from @grant-workflow/domain schemas.
 */

import { PrismaClient } from "@prisma/client";
import type {
  EligibilityRequest,
  EligibilityResponse,
} from "../../../../../packages/domain/src/schemas";
import { evaluateEligibility } from "../../../../../packages/policies/src";

const prisma = new PrismaClient();

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

  // 1. Load submission to get callId
  const submission = await prisma.submission.findUniqueOrThrow({
    where: { id: submissionId },
  });

  // 2. Resolve active rules from the call config, falling back to MVP defaults
  let activeRules = DEFAULT_ACTIVE_RULES;
  const call = await prisma.call.findUnique({ where: { id: submission.callId } });
  if (call && call.enabledEligibilityChecks.length > 0) {
    activeRules = call.enabledEligibilityChecks;
  }

  // 3. Evaluate (pure function — no DB)
  const evalResult = evaluateEligibility(inputs, activeRules);

  // 4. Determine next submission status
  const nextStatus =
    evalResult.status === "eligible" ? "eligible" : "eligibility_failed";

  // 5. Persist EligibilityRecord, update Submission status, emit AuditEvent
  await prisma.$transaction(async (tx) => {
    await tx.eligibilityRecord.create({
      data: {
        submissionId,
        status: evalResult.status,
        inputs: inputs as Record<string, unknown>,
        activeRules: evalResult.activeRules,
        failureReasons: evalResult.failureReasons,
      },
    });

    await tx.submission.update({
      where: { id: submissionId },
      data: { status: nextStatus },
    });

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
