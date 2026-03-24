/**
 * @grant-workflow/policies — public contract.
 *
 * Exports pure business-logic functions that route handlers, services,
 * and tests depend on. Internal file structure is free — the generated
 * backend may organise code however it likes as long as these exports
 * resolve with the correct signatures.
 *
 * All input/output types derive from @grant-workflow/domain schemas.
 */

import type {
  EligibilityInputs,
  ProposalVersion,
} from "../../domain/src/schemas";

// ---------------------------------------------------------------------------
// Eligibility evaluation (pure — no DB)
// ---------------------------------------------------------------------------

export interface EligibilityResult {
  status: "eligible" | "ineligible";
  failureReasons: string[];
  inputs: EligibilityInputs;
  activeRules: string[];
}

const BUDGET_THRESHOLD_K_EUR = 500;

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

  if (
    ruleSet.has("meetsEuropeanDimension") &&
    inputs.meetsEuropeanDimension === "false"
  ) {
    failureReasons.push("meetsEuropeanDimension");
  }

  if (
    ruleSet.has("requestedBudgetKEur") &&
    inputs.requestedBudgetKEur > BUDGET_THRESHOLD_K_EUR
  ) {
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

/** Valid transitions per specs/workflow-states.md */
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted"],
  submitted: ["eligible", "eligibility_failed"],
  eligible: ["under_review"],
  eligibility_failed: [],
  under_review: ["clarification_requested", "validation_pending", "rejected"],
  clarification_requested: ["revised"],
  revised: ["under_review"],
  validation_pending: ["selected", "rejected"],
  selected: [],
  rejected: [],
};

/**
 * Check whether a status transition is valid per specs/workflow-states.md.
 */
export function isValidTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/** Domain event to next status mapping */
const EVENT_TRANSITIONS: Record<string, Record<string, string>> = {
  submitted: {
    eligibility_pass: "eligible",
    eligibility_fail: "eligibility_failed",
  },
  eligible: {
    assign_reviewer: "under_review",
  },
  under_review: {
    clarification: "clarification_requested",
    shortlist: "validation_pending",
    reject: "rejected",
  },
  clarification_requested: {
    applicant_responds: "revised",
  },
  revised: {
    reassign: "under_review",
  },
  validation_pending: {
    validate_pass: "selected",
    validate_fail: "rejected",
  },
};

/**
 * Derive the next submission status from the current status and a domain event.
 *
 * Events: "eligibility_pass" → "eligible", "eligibility_fail" → "eligibility_failed".
 */
export function getNextStatus(currentStatus: string, event: string): string {
  const transitions = EVENT_TRANSITIONS[currentStatus];
  if (!transitions) {
    throw new Error(
      `No transitions defined for status: ${currentStatus}`,
    );
  }
  const next = transitions[event];
  if (!next) {
    throw new Error(
      `Unknown event "${event}" for status "${currentStatus}"`,
    );
  }
  return next;
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
 * Enforce access policies from specs/access-policies.md.
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
  // Rule 1: admin-all
  if (principal.role === "admin") {
    return true;
  }

  // Rule 2: deny-identity-to-reviewer (hard deny)
  if (principal.role === "reviewer" && resource === "ApplicantIdentity") {
    return false;
  }

  // Rule 3: reviewer-blinded-assigned — reviewer may only read BlindedPacket
  if (principal.role === "reviewer") {
    if (resource === "BlindedPacket" && action === "read") {
      return true;
    }
    return false;
  }

  // Rule 4: applicant-own-proposals
  if (principal.role === "applicant") {
    if (resource === "Submission" && (action === "read" || action === "write")) {
      return context?.ownerId === principal.userId;
    }
    return false;
  }

  // Rule 5: auditor — read-only AuditEvent
  if (principal.role === "auditor") {
    if (resource === "AuditEvent" && action === "read") {
      return true;
    }
    return false;
  }

  // Rule 6: default deny
  return false;
}
