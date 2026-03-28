// src/policies/index.ts

import type { EligibilityInputs, ProposalVersion } from "../domain/schemas";

// ---------------------------------------------------------------------------
// Eligibility evaluation
// ---------------------------------------------------------------------------

export interface EligibilityResult {
  status: "eligible" | "ineligible";
  failureReasons: string[];
  inputs: EligibilityInputs;
  activeRules: string[];
}

export const MVP_DEFAULT_RULES = [
  "submittedInEnglish",
  "alignedWithCall",
  "primaryObjectiveIsRd",
  "meetsEuropeanDimension",
  "requestedBudgetKEur",
  "firstTimeApplicantInProgramme",
];

/**
 * Evaluate eligibility inputs against the active rule set.
 * Only rules present in `activeRules` are checked.
 */
export function evaluateEligibility(
  inputs: EligibilityInputs,
  activeRules: string[],
): EligibilityResult {
  const ruleSet = new Set(activeRules);
  const failureReasons: string[] = [];

  if (ruleSet.has("submittedInEnglish") && !inputs.submittedInEnglish) {
    failureReasons.push("submittedInEnglish");
  }
  if (ruleSet.has("alignedWithCall") && !inputs.alignedWithCall) {
    failureReasons.push("alignedWithCall");
  }
  if (ruleSet.has("primaryObjectiveIsRd") && !inputs.primaryObjectiveIsRd) {
    failureReasons.push("primaryObjectiveIsRd");
  }
  if (ruleSet.has("meetsEuropeanDimension") && inputs.meetsEuropeanDimension === "false") {
    failureReasons.push("meetsEuropeanDimension");
  }
  if (ruleSet.has("requestedBudgetKEur") && inputs.requestedBudgetKEur > 500) {
    failureReasons.push("requestedBudgetKEur");
  }
  if (ruleSet.has("firstTimeApplicantInProgramme") && !inputs.firstTimeApplicantInProgramme) {
    failureReasons.push("firstTimeApplicantInProgramme");
  }

  return {
    status: failureReasons.length === 0 ? "eligible" : "ineligible",
    failureReasons,
    inputs,
    activeRules,
  };
}

// ---------------------------------------------------------------------------
// Blinded packet creation
// ---------------------------------------------------------------------------

export interface BlindedPacketData {
  proposalVersionId: string;
  content: Record<string, unknown>;
}

export interface ApplicantIdentityData {
  id: string;
  submissionId: string;
  legalName: string;
  email: string;
  country: string;
  organisation: string;
}

/**
 * Create a blinded (identity-stripped) packet from a proposal version.
 * The content contains only evaluable proposal fields — no identity data.
 */
export function createBlindedPacket(
  proposalVersion: ProposalVersion,
  _applicantIdentity: ApplicantIdentityData,
): BlindedPacketData {
  return {
    proposalVersionId: proposalVersion.id,
    content: {
      title: proposalVersion.title,
      abstract: proposalVersion.abstract,
      requestedBudgetKEur: proposalVersion.requestedBudgetKEur,
      budgetUsage: proposalVersion.budgetUsage,
      tasksBreakdown: proposalVersion.tasksBreakdown,
    },
  };
}

// ---------------------------------------------------------------------------
// Workflow state transitions
// ---------------------------------------------------------------------------

const PERMITTED_TRANSITIONS: Array<[string, string]> = [
  ["draft", "submitted"],
  ["submitted", "eligible"],
  ["submitted", "eligibility_failed"],
  ["eligible", "under_review"],
];

/**
 * Check whether a status transition is valid per openspec/specs/workflow-states.md.
 */
export function isValidTransition(from: string, to: string): boolean {
  return PERMITTED_TRANSITIONS.some(([f, t]) => f === from && t === to);
}

const EVENT_TRANSITIONS: Record<string, Record<string, string>> = {
  submitted: {
    eligibility_pass: "eligible",
    eligibility_fail: "eligibility_failed",
  },
};

/**
 * Derive the next submission status from the current status and a domain event.
 */
export function getNextStatus(currentStatus: string, event: string): string {
  const next = EVENT_TRANSITIONS[currentStatus]?.[event];
  if (next === undefined) throw new Error(`No transition for ${currentStatus} + ${event}`);
  return next;
}

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------

export interface AccessPrincipal {
  role: "applicant" | "admin" | "reviewer" | "validator" | "auditor";
  userId: string;
}

export type ResourceType =
  | "Submission"
  | "ProposalVersion"
  | "ApplicantIdentity"
  | "BlindedPacket"
  | "EligibilityRecord"
  | "AuditEvent";

/**
 * Enforce access policies from openspec/specs/access-policies.md.
 *
 * Priority order:
 *   1. admin-all
 *   2. deny-identity-to-reviewer (hard deny)
 *   3. reviewer-blinded-assigned (read BlindedPacket)
 *   4. applicant-own-proposals (read/write own Submission)
 *   5. auditor read-only AuditEvent
 *   6. Default: deny
 */
export function checkAccess(
  principal: AccessPrincipal,
  resource: ResourceType,
  action: "read" | "write" | "delete",
  context?: { ownerId?: string },
): boolean {
  // 1. admin-all
  if (principal.role === "admin") return true;

  // 2. deny-identity-to-reviewer (hard deny)
  if (principal.role === "reviewer" && resource === "ApplicantIdentity") return false;

  // 3. reviewer-blinded-assigned
  if (principal.role === "reviewer") {
    return resource === "BlindedPacket" && action === "read";
  }

  // 4. applicant-own-proposals
  if (principal.role === "applicant") {
    if (resource === "Submission" && (action === "read" || action === "write")) {
      return context?.ownerId === principal.userId;
    }
    return false;
  }

  // 5. auditor read-only AuditEvent
  if (principal.role === "auditor") {
    return resource === "AuditEvent" && action === "read";
  }

  // 6. Default: deny
  return false;
}
