/**
 * eligibilityService — service-layer for eligibility checks.
 */

import { prisma } from "../../lib/prisma";
import { evaluateEligibility, getNextStatus } from "../../policies";
import type { EligibilityRequest, EligibilityResponse } from "../../domain/schemas";
import type { Prisma } from "@prisma/client";

// MVP defaults from openspec/specs/mvp-profile.md
const MVP_DEFAULT_RULES = [
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

  // Derive active rules from call config; fall back to MVP defaults
  let activeRules = MVP_DEFAULT_RULES;
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { call: true },
    });
    if (submission?.call?.enabledEligibilityChecks?.length) {
      activeRules = submission.call.enabledEligibilityChecks;
    }
  } catch {
    // fallback to defaults
  }

  // Evaluate eligibility (pure function)
  const result = evaluateEligibility(inputs, activeRules);

  // Persist EligibilityRecord
  await prisma.eligibilityRecord.create({
    data: {
      submissionId,
      status: result.status,
      inputs: result.inputs as unknown as Prisma.InputJsonValue,
      activeRules: result.activeRules,
      failureReasons: result.failureReasons,
      evaluatedAt: new Date(),
    },
  });

  // Transition submission status
  const nextStatus = getNextStatus(
    "submitted",
    result.status === "eligible" ? "eligibility_pass" : "eligibility_fail",
  );

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
      } as unknown as Prisma.InputJsonValue,
      timestamp: new Date(),
    },
  });

  return {
    status: result.status,
    failureReasons: result.failureReasons,
  };
}
