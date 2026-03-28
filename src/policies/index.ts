// src/policies/index.ts

import type { EligibilityInputs, ProposalVersion } from "../domain/schemas";

// ---------------------------------------------------------------------------
// Eligibility evaluation (pure — no DB)
// ---------------------------------------------------------------------------

export const MVP_DEFAULT_RULES: string[] = [
  "submittedInEnglish",
  "alignedWithCall",
  "primaryObjectiveIsRd",
  "meetsEuropeanDimension",
  "requestedBudgetKEur",
  "firstTimeApplicantInProgramme",
];

export interface EligibilityResult {
  status: "eligible" | "ineligible";
  failureReasons: string[];
  inputs: EligibilityInputs;
  activeRules: string[];
}

/**
 * Evaluate eligibility inputs against the active rule set.
 *
 * Only rules present in `activeRules` are evaluated.
 * Budget threshold is 500 k EUR.
 */
export function evaluateEligibility(
  inputs: EligibilityInputs,
  activeRules: string[],
): EligibilityResult {
  const failureReasons: string[] = [];
  const ruleSet = new Set(activeRules);

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
// Blinded packet creation (pure — no DB)
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
 * The returned content contains evaluable fields only — no identity fields.
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
// Workflow state transitions (pure — no DB)
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

/**
 * Derive the next submission status from the current status and a domain event.
 */
export function getNextStatus(currentStatus: string, event: string): string {
  if (currentStatus === "submitted" && event === "eligibility_pass") return "eligible";
  if (currentStatus === "submitted" && event === "eligibility_fail") return "eligibility_failed";
  return currentStatus;
}

// ---------------------------------------------------------------------------
// Access control (pure — no DB)
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
 * Rules (in priority order):
 *   1. admin-all
 *   2. deny-identity-to-reviewer (hard deny)
 *   3. reviewer-blinded-assigned (read only)
 *   4. applicant-own-proposals (read/write own Submission)
 *   5. auditor: read-only AuditEvent
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

  // 2. deny-identity-to-reviewer (hard deny — checked before any allow)
  if (principal.role === "reviewer" && resource === "ApplicantIdentity") return false;

  // 3. reviewer-blinded-assigned: read BlindedPacket only
  if (principal.role === "reviewer" && resource === "BlindedPacket" && action === "read") return true;

  // 4. applicant-own-proposals: read/write own Submission only (excludes BlindedPacket, EligibilityRecord)
  if (
    principal.role === "applicant" &&
    resource === "Submission" &&
    (action === "read" || action === "write") &&
    context?.ownerId === principal.userId
  ) {
    return true;
  }

  // 5. auditor: read-only AuditEvent
  if (principal.role === "auditor" && resource === "AuditEvent" && action === "read") return true;

  // 6. Default deny
  return false;
}
