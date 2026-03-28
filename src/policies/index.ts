/**
 * @grant-workflow/policies — public contract implementations.
 *
 * Pure business-logic functions with no DB dependencies.
 * All input/output types derive from @grant-workflow/domain schemas.
 */

import type {
  EligibilityInputs,
  ProposalVersion,
} from "../domain/schemas";

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
  if (
    ruleSet.has("meetsEuropeanDimension") &&
    inputs.meetsEuropeanDimension === "false"
  ) {
    failureReasons.push("meetsEuropeanDimension");
  }
  if (
    ruleSet.has("requestedBudgetKEur") &&
    inputs.requestedBudgetKEur > 500
  ) {
    failureReasons.push("requestedBudgetKEur");
  }
  if (
    ruleSet.has("firstTimeApplicantInProgramme") &&
    !inputs.firstTimeApplicantInProgramme
  ) {
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
 * Create a blinded (identity-stripped) packet from a proposal version and
 * applicant identity. The returned `content` must contain evaluable fields
 * (title, abstract, budget, etc.) and must NOT contain identity fields
 * (legalName, email, country, organisation, applicantAlias).
 */
export function createBlindedPacket(
  proposalVersion: ProposalVersion,
  _applicantIdentity: ApplicantIdentityData,
): BlindedPacketData {
  const { id, submissionId: _sid, ...evaluableContent } = proposalVersion;
  return {
    proposalVersionId: id,
    content: evaluableContent,
  };
}

// ---------------------------------------------------------------------------
// Workflow state transitions (pure — no DB)
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted"],
  submitted: ["eligible", "eligibility_failed"],
  eligible: ["under_review"],
  eligibility_failed: [],
  under_review: ["clarification_requested", "validation_pending", "rejected"],
  clarification_requested: ["revised"],
  revised: ["submitted", "under_review"],
  validation_pending: ["selected", "rejected"],
  selected: [],
  rejected: [],
};

/**
 * Check whether a status transition is valid per openspec/specs/workflow-states.md.
 */
export function isValidTransition(from: string, to: string): boolean {
  return (VALID_TRANSITIONS[from] ?? []).includes(to);
}

/**
 * Derive the next submission status from the current status and a domain event.
 *
 * Events: "eligibility_pass" → "eligible", "eligibility_fail" → "eligibility_failed".
 */
export function getNextStatus(currentStatus: string, event: string): string {
  void currentStatus;
  if (event === "eligibility_pass") return "eligible";
  if (event === "eligibility_fail") return "eligibility_failed";
  throw new Error(`Unknown event: ${event}`);
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
  // Rule 1: admin-all
  if (principal.role === "admin") return true;

  // Rule 2: deny-identity-to-reviewer (hard deny)
  if (principal.role === "reviewer" && resource === "ApplicantIdentity") {
    return false;
  }

  // Rule 3: reviewer-blinded-assigned (read only)
  if (
    principal.role === "reviewer" &&
    resource === "BlindedPacket" &&
    action === "read"
  ) {
    return true;
  }

  // reviewer default deny
  if (principal.role === "reviewer") return false;

  // Rule 4: applicant-own-proposals (read | write on own Submission only)
  if (
    principal.role === "applicant" &&
    resource === "Submission" &&
    (action === "read" || action === "write")
  ) {
    return context?.ownerId === principal.userId;
  }

  // applicant default deny
  if (principal.role === "applicant") return false;

  // Rule 5: auditor read-only access to AuditEvent
  if (
    principal.role === "auditor" &&
    resource === "AuditEvent" &&
    action === "read"
  ) {
    return true;
  }

  // auditor default deny
  if (principal.role === "auditor") return false;

  // validator: no explicit rules → deny
  return false;
}
