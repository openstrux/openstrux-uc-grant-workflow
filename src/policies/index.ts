/**
 * @grant-workflow/policies — implementations.
 *
 * All policy logic lives here. packages/policies/src/index.ts re-exports everything.
 */

import type {
  EligibilityInputs,
  ProposalVersion,
} from "../domain/schemas";

// ---------------------------------------------------------------------------
// MVP default rule set
// ---------------------------------------------------------------------------

export const MVP_DEFAULT_RULES: string[] = [
  "submittedInEnglish",
  "alignedWithCall",
  "primaryObjectiveIsRd",
  "meetsEuropeanDimension",
  "requestedBudgetKEur",
  "firstTimeApplicantInProgramme",
];

// ---------------------------------------------------------------------------
// Eligibility evaluation (pure — no DB)
// ---------------------------------------------------------------------------

export interface EligibilityResult {
  status: "eligible" | "ineligible";
  failureReasons: string[];
  inputs: EligibilityInputs;
  activeRules: string[];
}

/**
 * Evaluate eligibility inputs against the active rule set.
 *
 * Only rules present in `activeRules` are checked.
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
 * Content contains evaluable fields only — no identity fields.
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

const PERMITTED_TRANSITIONS: [string, string][] = [
  ["draft", "submitted"],
  ["submitted", "eligible"],
  ["submitted", "eligibility_failed"],
  ["eligible", "under_review"],
];

/**
 * Check whether a status transition is valid per workflow-states.md.
 */
export function isValidTransition(from: string, to: string): boolean {
  return PERMITTED_TRANSITIONS.some(([f, t]) => f === from && t === to);
}

const STATUS_EVENTS: Record<string, Record<string, string>> = {
  submitted: {
    eligibility_pass: "eligible",
    eligibility_fail: "eligibility_failed",
  },
};

/**
 * Derive the next submission status from the current status and a domain event.
 */
export function getNextStatus(currentStatus: string, event: string): string {
  return STATUS_EVENTS[currentStatus]?.[event] ?? currentStatus;
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
 *
 * @param context.ownerId — userId of the resource owner (required for applicant own-resource checks)
 */
export function checkAccess(
  principal: AccessPrincipal,
  resource: ResourceType,
  action: "read" | "write" | "delete",
  context?: { ownerId?: string },
): boolean {
  // 1. admin-all
  if (principal.role === "admin") {
    return true;
  }

  // 2. deny-identity-to-reviewer (hard deny)
  if (principal.role === "reviewer" && resource === "ApplicantIdentity") {
    return false;
  }

  // 3. reviewer-blinded-assigned: read BlindedPacket only
  if (principal.role === "reviewer") {
    return resource === "BlindedPacket" && action === "read";
  }

  // 4. applicant-own-proposals: read/write own Submission only (not BlindedPacket)
  if (principal.role === "applicant") {
    if (resource === "Submission" && (action === "read" || action === "write")) {
      return context?.ownerId === principal.userId;
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
