/**
 * eligibilityService — eligibility check orchestration.
 */

import { type Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";
import { evaluateEligibility, MVP_DEFAULT_RULES } from "../../policies";
import type { EligibilityRequest, EligibilityResponse } from "../../domain/schemas";

/**
 * Run a full eligibility check: evaluate inputs against the call's active
 * rule set, persist EligibilityRecord, transition submission status, create AuditEvent.
 *
 * actorId defaults to "system" when not provided by the route handler.
 */
export async function runEligibilityCheck(
  request: EligibilityRequest,
  actorId = "system",
): Promise<EligibilityResponse> {
  const { submissionId, inputs } = request;

  // Derive active rules from the Call, falling back to MVP_DEFAULT_RULES
  let activeRules: string[] = MVP_DEFAULT_RULES;
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { callId: true },
    });
    if (submission?.callId) {
      const call = await prisma.call.findUnique({
        where: { id: submission.callId },
        select: { enabledEligibilityChecks: true },
      });
      if (call?.enabledEligibilityChecks?.length) {
        activeRules = call.enabledEligibilityChecks;
      }
    }
  } catch {
    // Fall back to defaults on any lookup error
  }

  // Evaluate eligibility
  const result = evaluateEligibility(inputs, activeRules);

  // Persist EligibilityRecord
  await prisma.eligibilityRecord.create({
    data: {
      submissionId,
      status: result.status === "eligible" ? "eligible" : "ineligible",
      inputs: inputs as unknown as Prisma.InputJsonValue,
      activeRules: result.activeRules,
      failureReasons: result.failureReasons,
    },
  });

  // Update Submission.status
  const newStatus = result.status === "eligible" ? "eligible" : "eligibility_failed";
  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: newStatus },
  });

  // Create AuditEvent
  await prisma.auditEvent.create({
    data: {
      actorId,
      eventType: "eligibility.checked",
      targetType: "Submission",
      targetId: submissionId,
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
