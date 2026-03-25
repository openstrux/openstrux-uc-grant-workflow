/**
 * @grant-workflow/policies — public contract.
 *
 * Exports pure business-logic functions that route handlers, services,
 * and tests depend on. No DB access — all functions are deterministic.
 */

import type {
  EligibilityInputs,
  ProposalVersion,
} from "../domain/schemas/index";

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
 * Rules are identified by camelCase name (e.g. "submittedInEnglish").
 * Only rules present in `activeRules` are checked.
 * Budget threshold defaults to 500 k EUR.
 */
export function evaluateEligibility(
  inputs: EligibilityInputs,
  activeRules: string[],
): EligibilityResult {
  const failureReasons: string[] = [];
  const activeSet = new Set(activeRules);

  if (activeSet.has("submittedInEnglish") && !inputs.submittedInEnglish) {
    failureReasons.push("submittedInEnglish");
  }

  if (activeSet.has("alignedWithCall") && !inputs.alignedWithCall) {
    failureReasons.push("alignedWithCall");
  }

  if (activeSet.has("primaryObjectiveIsRd") && !inputs.primaryObjectiveIsRd) {
    failureReasons.push("primaryObjectiveIsRd");
  }

  if (
    activeSet.has("meetsEuropeanDimension") &&
    inputs.meetsEuropeanDimension === "false"
  ) {
    failureReasons.push("meetsEuropeanDimension");
  }

  if (activeSet.has("requestedBudgetKEur") && inputs.requestedBudgetKEur > 500) {
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
 * Create a blinded (identity-stripped) packet from a proposal version and
 * applicant identity. The returned `content` must contain evaluable fields
 * (title, abstract, budget, etc.) and must NOT contain identity fields
 * (legalName, email, country, organisation, applicantAlias).
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
      versionNumber: proposalVersion.versionNumber,
    },
  };
}

// ---------------------------------------------------------------------------
// Workflow state transitions (pure — no DB)
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted"],
  submitted: ["eligible", "eligibility_failed"],
  eligible: ["under_review"],
  under_review: ["clarification_requested", "validation_pending", "rejected"],
  clarification_requested: ["revised"],
  revised: ["under_review", "validation_pending"],
  validation_pending: ["selected", "rejected"],
  eligibility_failed: [],
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
  if (currentStatus === "submitted" && event === "eligibility_pass") {
    return "eligible";
  }
  if (currentStatus === "submitted" && event === "eligibility_fail") {
    return "eligibility_failed";
  }
  throw new Error(
    `No transition defined for status="${currentStatus}" + event="${event}"`,
  );
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
  if (principal.role === "admin") {
    return true;
  }

  // 2. deny-identity-to-reviewer (hard deny)
  if (principal.role === "reviewer" && resource === "ApplicantIdentity") {
    return false;
  }

  // 3. reviewer-blinded-assigned
  if (principal.role === "reviewer") {
    if (resource === "BlindedPacket" && action === "read") {
      return true;
    }
    return false;
  }

  // 4. applicant-own-proposals
  if (principal.role === "applicant") {
    if (resource === "BlindedPacket") return false;
    if (resource === "EligibilityRecord") return false;
    if (resource === "Submission" && (action === "read" || action === "write")) {
      return context?.ownerId === principal.userId;
    }
    return false;
  }

  // 5. auditor: read-only on AuditEvent
  if (principal.role === "auditor") {
    if (resource === "AuditEvent" && action === "read") {
      return true;
    }
    return false;
  }

  // 6. Default: deny
  return false;
}
