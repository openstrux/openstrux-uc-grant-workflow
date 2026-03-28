// src/policies/index.ts
/**
 * @grant-workflow/policies — pure business-logic functions.
 *
 * No database access.  All inputs and outputs use domain types from
 * @grant-workflow/domain schemas.
 */

import type {
  EligibilityInputs,
  ProposalVersion,
} from "../domain/schemas";

// ---------------------------------------------------------------------------
// Eligibility evaluation
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
 * Budget threshold is 500 k EUR.
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

  if (ruleSet.has("requestedBudgetKEur") && inputs.requestedBudgetKEur > 500) {
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
 *
 * The returned `content` contains only evaluable fields (title, abstract,
 * budget, usage, tasks) and MUST NOT contain any identity field (legalName,
 * email, country, organisation, applicantAlias, applicantIdentity).
 */
export function createBlindedPacket(
  proposalVersion: ProposalVersion,
  _applicantIdentity: ApplicantIdentityData,
): BlindedPacketData {
  const { title, abstract, requestedBudgetKEur, budgetUsage, tasksBreakdown } =
    proposalVersion;

  return {
    proposalVersionId: proposalVersion.id,
    content: {
      title,
      abstract,
      requestedBudgetKEur,
      budgetUsage,
      tasksBreakdown,
    },
  };
}

// ---------------------------------------------------------------------------
// Workflow state transitions
// ---------------------------------------------------------------------------

/** Valid forward transitions per openspec/specs/workflow-states.md. */
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted"],
  submitted: ["eligible", "eligibility_failed"],
  eligible: ["under_review"],
  under_review: ["clarification_requested", "validation_pending", "rejected"],
  clarification_requested: ["revised"],
  revised: ["under_review"],
  validation_pending: ["selected", "rejected"],
};

/**
 * Check whether a status transition is valid per workflow-states spec.
 */
export function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Domain events mapped to resulting statuses. */
const EVENT_MAP: Record<string, Record<string, string>> = {
  submitted: {
    eligibility_pass: "eligible",
    eligibility_fail: "eligibility_failed",
  },
};

/**
 * Derive the next submission status from the current status and a domain event.
 *
 * Events: "eligibility_pass" → "eligible", "eligibility_fail" → "eligibility_failed".
 */
export function getNextStatus(currentStatus: string, event: string): string {
  const next = EVENT_MAP[currentStatus]?.[event];
  if (!next) {
    throw new Error(
      `No transition for status "${currentStatus}" and event "${event}"`,
    );
  }
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
 * Rules (priority order):
 *   1. admin-all             — admin may perform any action on any resource.
 *   2. deny-identity-to-reviewer — reviewer ALWAYS denied ApplicantIdentity.
 *   3. reviewer-blinded-assigned — reviewer may READ BlindedPacket.
 *   4. applicant-own-proposals   — applicant may read/write own Submission.
 *   5. auditor               — read-only access to AuditEvent.
 *   6. Default               — deny.
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

  // Rule 3: reviewer-blinded-assigned — read only
  if (
    principal.role === "reviewer" &&
    resource === "BlindedPacket" &&
    action === "read"
  ) {
    return true;
  }

  // Rule 4: applicant-own-proposals — read/write on own Submission
  if (
    principal.role === "applicant" &&
    resource === "Submission" &&
    (action === "read" || action === "write") &&
    context?.ownerId === principal.userId
  ) {
    return true;
  }

  // Rule 5: auditor — read-only on AuditEvent
  if (
    principal.role === "auditor" &&
    resource === "AuditEvent" &&
    action === "read"
  ) {
    return true;
  }

  // Rule 6: default deny
  return false;
}
