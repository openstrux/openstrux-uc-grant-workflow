// src/server/services/eligibilityService.ts

import type { EligibilityRequest, EligibilityResponse } from "../../domain/schemas";
import { prisma } from "../../lib/prisma";
import { evaluateEligibility, MVP_DEFAULT_RULES } from "../../policies";

/**
 * Run a full eligibility check: evaluate inputs against the call's active
 * rule set, persist the EligibilityRecord, transition the submission status,
 * and create an audit event.
 */
export async function runEligibilityCheck(
  request: EligibilityRequest,
): Promise<EligibilityResponse> {
  // Derive active rules from the call if available; fall back to MVP defaults
  let activeRules: string[] = [...MVP_DEFAULT_RULES];

  const submission = await prisma.submission.findUnique({
    where: { id: request.submissionId },
    select: { callId: true },
  });

  if (submission) {
    const call = await prisma.call.findUnique({
      where: { id: submission.callId },
      select: { enabledEligibilityChecks: true },
    });
    if (call?.enabledEligibilityChecks && call.enabledEligibilityChecks.length > 0) {
      activeRules = call.enabledEligibilityChecks;
    }
  }

  // Pure evaluation
  const evalResult = evaluateEligibility(request.inputs, activeRules);

  // Persist EligibilityRecord
  await prisma.eligibilityRecord.create({
    data: {
      submissionId: request.submissionId,
      status: evalResult.status,
      inputs: JSON.parse(JSON.stringify(request.inputs)),
      activeRules: evalResult.activeRules,
      failureReasons: evalResult.failureReasons,
    },
  });

  // Transition submission status
  const submissionStatus =
    evalResult.status === "eligible" ? "eligible" : "eligibility_failed";

  await prisma.submission.update({
    where: { id: request.submissionId },
    data: { status: submissionStatus },
  });

  // Emit audit event
  await prisma.auditEvent.create({
    data: {
      eventType: "eligibility.checked",
      actorId: "system",
      targetType: "Submission",
      targetId: request.submissionId,
      payload: {
        status: evalResult.status,
        failureReasons: evalResult.failureReasons,
      },
      submissionId: request.submissionId,
    },
  });

  return {
    status: evalResult.status,
    failureReasons: evalResult.failureReasons,
  };
}
