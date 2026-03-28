// src/server/services/eligibilityService.ts

import { PrismaClient, Prisma } from "@prisma/client";
import type { EligibilityRequest, EligibilityResponse } from "../../domain/schemas";
import { evaluateEligibility, getNextStatus, MVP_DEFAULT_RULES } from "../../policies";

const prisma = new PrismaClient();

/**
 * Run a full eligibility check: evaluate inputs against the call's active
 * rule set, persist the EligibilityRecord, transition the submission status,
 * and create an audit event.
 */
export async function runEligibilityCheck(
  request: EligibilityRequest,
): Promise<EligibilityResponse> {
  const { submissionId, inputs } = request;

  // Derive active rules from the associated Call, falling back to MVP defaults
  let activeRules: string[] = MVP_DEFAULT_RULES;
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { call: true },
  });

  if (submission?.call?.enabledEligibilityChecks?.length) {
    activeRules = submission.call.enabledEligibilityChecks;
  }

  const result = evaluateEligibility(inputs, activeRules);

  const dbStatus = result.status === "eligible" ? "eligible" : "eligibility_failed";

  await prisma.eligibilityRecord.create({
    data: {
      submissionId,
      status: result.status,
      inputs: inputs as unknown as Prisma.InputJsonValue,
      activeRules,
      failureReasons: result.failureReasons,
    },
  });

  const nextStatus = getNextStatus(
    "submitted",
    result.status === "eligible" ? "eligibility_pass" : "eligibility_fail",
  );

  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: nextStatus },
  });

  await prisma.auditEvent.create({
    data: {
      eventType: "eligibility.checked",
      actorId: "system",
      targetType: "Submission",
      targetId: submissionId,
      payload: {
        status: dbStatus,
        failureReasons: result.failureReasons,
        activeRules,
      },
    },
  });

  return {
    status: result.status,
    failureReasons: result.failureReasons,
  };
}
