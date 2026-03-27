// src/server/services/eligibilityService.ts

import type { Prisma } from "@prisma/client";
import type { EligibilityRequest, EligibilityResponse } from "../../domain/schemas";
import { prisma } from "../../lib/prisma";
import { evaluateEligibility } from "../../policies";

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

  let activeRules = MVP_DEFAULT_RULES;

  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { call: true },
    });
    if (
      submission?.call?.enabledEligibilityChecks &&
      submission.call.enabledEligibilityChecks.length > 0
    ) {
      activeRules = submission.call.enabledEligibilityChecks;
    }
  } catch {
    // Fall back to MVP defaults
  }

  const result = evaluateEligibility(inputs, activeRules);
  const newStatus = result.status === "eligible" ? "eligible" : "eligibility_failed";

  await prisma.eligibilityRecord.create({
    data: {
      submissionId,
      status: result.status,
      inputs: inputs as unknown as Prisma.InputJsonValue,
      activeRules: result.activeRules,
      failureReasons: result.failureReasons,
    },
  });

  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: newStatus },
  });

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
    },
  });

  return {
    status: result.status,
    failureReasons: result.failureReasons,
  };
}
