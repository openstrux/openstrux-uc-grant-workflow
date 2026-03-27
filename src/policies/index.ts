/**
 * @grant-workflow/policies — pure business-logic functions.
 *
 * No database access. All input/output types derive from domain schemas.
 */

import type { EligibilityInputs, ProposalVersion } from "../domain/schemas";

// ---------------------------------------------------------------------------
// Eligibility evaluation (pure — no DB)
// ---------------------------------------------------------------------------

export interface EligibilityResult {
  status: "eligible" | "ineligible";
  failureReasons: string[];
  inputs: EligibilityInputs;
  activeRules: string[];
}

const BUDGET_LIMIT_K_EUR = 500;

/**
 * Evaluate eligibility inputs against the active rule set.
 *
 * Rules are identified by camelCase name (e.g. "submittedInEnglish").
 * Only rules present in `activeRules` are checked.
 * Budget threshold defaults to 500 k EUR.
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

  if (ruleSet.has("requestedBudgetKEur") && inputs.requestedBudgetKEur > BUDGET_LIMIT_K_EUR) {
    failureReasons.push("requestedBudgetKEur");
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
 * The returned `content` contains evaluable fields only — no identity data.
 * mustContain: title, abstract, requestedBudgetKEur, budgetUsage, tasksBreakdown
 * mustExclude: legalName, email, country, organisation, applicantAlias, applicantIdentity,
 *              submissionId, proposalVersionId
 */
export function createBlindedPacket(
  proposalVersion: ProposalVersion,
  _applicantIdentity: ApplicantIdentityData,
): BlindedPacketData {
  const content: Record<string, unknown> = {
    title: proposalVersion.title,
    abstract: proposalVersion.abstract,
    requestedBudgetKEur: proposalVersion.requestedBudgetKEur,
    budgetUsage: proposalVersion.budgetUsage,
    tasksBreakdown: proposalVersion.tasksBreakdown,
    versionNumber: proposalVersion.versionNumber,
  };

  return {
    proposalVersionId: proposalVersion.id,
    content,
  };
}

// ---------------------------------------------------------------------------
// Workflow state transitions (pure — no DB)
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted"],
  submitted: ["eligible", "eligibility_failed"],
  eligibility_failed: [],
  eligible: ["under_review"],
  under_review: ["clarification_requested", "validation_pending", "rejected"],
  clarification_requested: ["revised"],
  revised: ["under_review", "validation_pending", "rejected"],
  validation_pending: ["selected", "rejected"],
  selected: [],
  rejected: [],
};

/**
 * Check whether a status transition is valid per openspec/specs/workflow-states.md.
 */
export function isValidTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/**
 * Derive the next submission status from the current status and a domain event.
 *
 * Events: "eligibility_pass" → "eligible", "eligibility_fail" → "eligibility_failed".
 */
export function getNextStatus(currentStatus: string, event: string): string {
  if (currentStatus === "submitted" && event === "eligibility_pass") return "eligible";
  if (currentStatus === "submitted" && event === "eligibility_fail") return "eligibility_failed";
  throw new Error(`No transition defined for status "${currentStatus}" and event "${event}"`);
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
 *   1. admin-all: admin may perform any action on any resource.
 *   2. deny-identity-to-reviewer: reviewer is ALWAYS denied ApplicantIdentity (hard deny).
 *   3. reviewer-blinded-assigned: reviewer may read BlindedPacket.
 *   4. applicant-own-proposals: applicant may read/write own Submission
 *      where context.ownerId === principal.userId (excludes BlindedPacket).
 *   5. auditor: read-only access to AuditEvent.
 *   6. Default: deny.
 */
export function checkAccess(
  principal: AccessPrincipal,
  resource: ResourceType,
  action: "read" | "write" | "delete",
  context?: { ownerId?: string },
): boolean {
  // 1. admin-all
  if (principal.role === "admin") return true;

  // 2. deny-identity-to-reviewer (hard deny — checked before any allow rule)
  if (principal.role === "reviewer" && resource === "ApplicantIdentity") return false;

  // 3. reviewer-blinded-assigned: reviewer may read BlindedPacket
  if (principal.role === "reviewer" && resource === "BlindedPacket" && action === "read") {
    return true;
  }

  // reviewer cannot access anything else
  if (principal.role === "reviewer") return false;

  // 4. applicant-own-proposals
  if (principal.role === "applicant") {
    if (resource === "BlindedPacket") return false;
    if (resource === "EligibilityRecord") return false;
    if (resource === "AuditEvent") return false;
    if (
      (resource === "Submission" || resource === "ProposalVersion") &&
      (action === "read" || action === "write")
    ) {
      if (context?.ownerId === undefined) return false;
      return context.ownerId === principal.userId;
    }
    return false;
  }

  // 5. auditor: read-only AuditEvent
  if (principal.role === "auditor") {
    return resource === "AuditEvent" && action === "read";
  }

  // 6. Default deny
  return false;
}
