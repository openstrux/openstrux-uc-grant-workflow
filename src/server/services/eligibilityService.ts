/**
 * eligibilityService — service-layer for eligibility checks.
 *
 * Orchestrates: evaluate → persist EligibilityRecord → transition status → audit event.
 */

import { PrismaClient } from "@prisma/client";
import type {
  EligibilityRequest,
  EligibilityResponse,
} from "../../domain/schemas/index";
import { evaluateEligibility, getNextStatus } from "../../policies/index";

const prisma = new PrismaClient();

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
  // 1. Derive active rules from the call configuration (fall back to defaults)
  const submission = await prisma.submission.findUnique({
    where: { id: request.submissionId },
    include: { call: true },
  });

  const activeRules: string[] =
    (submission?.call?.enabledEligibilityChecks as string[] | undefined) ??
    DEFAULT_ACTIVE_RULES;

  // 2. Evaluate eligibility (pure function)
  const result = evaluateEligibility(request.inputs, activeRules);

  // 3. Persist EligibilityRecord
  await prisma.eligibilityRecord.create({
    data: {
      submissionId: request.submissionId,
      status: result.status,
      inputs: JSON.parse(JSON.stringify(request.inputs)) as object,
      activeRules: result.activeRules,
      failureReasons: result.failureReasons,
    },
  });

  // 4. Transition submission status
  const event =
    result.status === "eligible" ? "eligibility_pass" : "eligibility_fail";
  const nextStatus = getNextStatus("submitted", event);

  await prisma.submission.update({
    where: { id: request.submissionId },
    data: { status: nextStatus },
  });

  // 5. Create AuditEvent
  await prisma.auditEvent.create({
    data: {
      eventType: "eligibility.checked",
      actorId: "system",
      targetType: "Submission",
      targetId: request.submissionId,
      payload: JSON.parse(
        JSON.stringify({
          status: result.status,
          failureReasons: result.failureReasons,
          activeRules: result.activeRules,
        }),
      ) as object,
    },
  });

  return {
    status: result.status,
    failureReasons: result.failureReasons,
  };
}
