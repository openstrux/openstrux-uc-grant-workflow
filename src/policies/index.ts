// src/policies/index.ts

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
 * Ordered default rule set — all six MVP checks.
 * Matches openspec/specs/mvp-profile.md §Enabled eligibility checks.
 */
export const MVP_DEFAULT_RULES: string[] = [
  "submittedInEnglish",
  "alignedWithCall",
  "primaryObjectiveIsRd",
  "meetsEuropeanDimension",
  "requestedBudgetKEur",
  "firstTimeApplicantInProgramme",
];

/**
 * Evaluate eligibility inputs against the active rule set.
 *
 * Rules are identified by camelCase name.
 * Only rules present in `activeRules` are checked.
 * Budget threshold is 500 k EUR.
 */
export function evaluateEligibility(
  inputs: EligibilityInputs,
  activeRules: string[],
): EligibilityResult {
  const activeSet = new Set(activeRules);
  const failureReasons: string[] = [];

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
  if (
    activeSet.has("requestedBudgetKEur") &&
    inputs.requestedBudgetKEur > 500
  ) {
    failureReasons.push("requestedBudgetKEur");
  }
  if (
    activeSet.has("firstTimeApplicantInProgramme") &&
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
 * Create a blinded (identity-stripped) packet from a proposal version.
 * Returns only evaluable fields; all identity fields are excluded.
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
  };

  return {
    proposalVersionId: proposalVersion.id,
    content,
  };
}

// ---------------------------------------------------------------------------
// Workflow state transitions (pure — no DB)
// ---------------------------------------------------------------------------

const ALLOWED_TRANSITIONS: ReadonlySet<string> = new Set([
  "draft:submitted",
  "submitted:eligible",
  "submitted:eligibility_failed",
  "eligible:under_review",
]);

/**
 * Check whether a status transition is valid per openspec/specs/workflow-states.md.
 */
export function isValidTransition(from: string, to: string): boolean {
  return ALLOWED_TRANSITIONS.has(`${from}:${to}`);
}

const NEXT_STATUS_MAP: Record<string, string> = {
  "submitted:eligibility_pass": "eligible",
  "submitted:eligibility_fail": "eligibility_failed",
};

/**
 * Derive the next submission status from the current status and a domain event.
 */
export function getNextStatus(currentStatus: string, event: string): string {
  const key = `${currentStatus}:${event}`;
  const next = NEXT_STATUS_MAP[key];
  if (!next) {
    throw new Error(`No transition defined for status="${currentStatus}" event="${event}"`);
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
 * Enforce access policies from openspec/specs/access-policies.md.
 *
 * Priority order:
 *   1. admin-all: admin may perform any action on any resource.
 *   2. deny-identity-to-reviewer: reviewer is ALWAYS denied ApplicantIdentity.
 *   3. reviewer-blinded-assigned: reviewer may read BlindedPacket only.
 *   4. applicant-own-proposals: applicant may read/write own Submission (not BlindedPacket).
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
  if (principal.role === "admin") {
    return true;
  }

  // Rule 2: deny-identity-to-reviewer (hard deny, checked before any allow)
  if (principal.role === "reviewer" && resource === "ApplicantIdentity") {
    return false;
  }

  // Rule 3: reviewer-blinded-assigned — read-only on BlindedPacket
  if (principal.role === "reviewer") {
    return resource === "BlindedPacket" && action === "read";
  }

  // Rule 4: applicant-own-proposals
  if (principal.role === "applicant") {
    if (resource === "BlindedPacket") return false;
    if (resource === "Submission") {
      return (
        (action === "read" || action === "write") &&
        context?.ownerId === principal.userId
      );
    }
    return false;
  }

  // Rule 5: auditor — read-only on AuditEvent
  if (principal.role === "auditor") {
    return resource === "AuditEvent" && action === "read";
  }

  // Default: deny
  return false;
}
