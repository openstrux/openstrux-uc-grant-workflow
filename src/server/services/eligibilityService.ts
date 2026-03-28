// src/server/services/eligibilityService.ts

import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  evaluateEligibility,
  getNextStatus,
  MVP_DEFAULT_RULES,
} from "../../policies";
import type {
  EligibilityRequest,
  EligibilityResponse,
} from "../../domain/schemas";

/**
 * Run a full eligibility check: evaluate inputs against the call's active
 * rule set, persist the EligibilityRecord, transition the submission status,
 * and create an audit event.
 */
export async function runEligibilityCheck(
  request: EligibilityRequest,
): Promise<EligibilityResponse> {
  const { submissionId, inputs } = request;

  // Derive active rules from the Call, fall back to MVP defaults
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { call: true },
  });

  const activeRules: string[] =
    submission?.call?.enabledEligibilityChecks?.length
      ? submission.call.enabledEligibilityChecks
      : MVP_DEFAULT_RULES;

  // Evaluate eligibility (pure function)
  const result = evaluateEligibility(inputs, activeRules);

  // Determine next status
  const event = result.status === "eligible" ? "eligibility_pass" : "eligibility_fail";
  const nextStatus = getNextStatus("submitted", event);

  // Persist EligibilityRecord
  await prisma.eligibilityRecord.create({
    data: {
      submissionId,
      status: result.status,
      inputs: inputs as unknown as Prisma.InputJsonValue,
      activeRules,
      failureReasons: result.failureReasons,
    },
  });

  // Update Submission status
  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: nextStatus },
  });

  // Audit event
  await prisma.auditEvent.create({
    data: {
      eventType: "eligibility.checked",
      actorId: "system",
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
