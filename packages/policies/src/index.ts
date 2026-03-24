/**
 * @grant-workflow/policies — public contract.
 *
 * Exports pure business-logic functions that route handlers, services,
 * and tests depend on. No database access — all functions are pure.
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

  for (const rule of activeRules) {
    switch (rule) {
      case "submittedInEnglish":
        if (!inputs.submittedInEnglish) {
          failureReasons.push("submittedInEnglish");
        }
        break;
      case "alignedWithCall":
        if (!inputs.alignedWithCall) {
          failureReasons.push("alignedWithCall");
        }
        break;
      case "primaryObjectiveIsRd":
        if (!inputs.primaryObjectiveIsRd) {
          failureReasons.push("primaryObjectiveIsRd");
        }
        break;
      case "meetsEuropeanDimension":
        // "false" fails; "true" and "not_applicable" pass
        if (inputs.meetsEuropeanDimension === "false") {
          failureReasons.push("meetsEuropeanDimension");
        }
        break;
      case "requestedBudgetKEur":
        // Max budget: 500 k EUR
        if (inputs.requestedBudgetKEur > 500) {
          failureReasons.push("requestedBudgetKEur");
        }
        break;
      // Unknown rules are silently ignored
    }
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
 * The returned `content` contains only evaluable fields and MUST NOT contain
 * any identity fields (legalName, email, country, organisation, applicantAlias).
 */
export function createBlindedPacket(
  proposalVersion: ProposalVersion,
  _applicantIdentity: ApplicantIdentityData,
): BlindedPacketData {
  // Extract only the evaluable content fields — identity is never included
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
// Workflow state transitions (pure — no DB)
// ---------------------------------------------------------------------------

/**
 * Valid state transitions per specs/workflow-states.md.
 * Keys are "from" states; values are allowed "to" states.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted"],
  submitted: ["eligible", "eligibility_failed"],
  eligibility_failed: [],
  eligible: ["under_review"],
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
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Derive the next submission status from the current status and a domain event.
 *
 * Events: "eligibility_pass" → "eligible", "eligibility_fail" → "eligibility_failed".
 */
export function getNextStatus(currentStatus: string, event: string): string {
  const eventMap: Record<string, string> = {
    submit: "submitted",
    eligibility_pass: "eligible",
    eligibility_fail: "eligibility_failed",
    assign_reviewer: "under_review",
    request_clarification: "clarification_requested",
    applicant_responds: "revised",
    shortlist: "validation_pending",
    validate_selected: "selected",
    reject: "rejected",
  };

  const next = eventMap[event];
  if (next === undefined) {
    throw new Error(`Unknown event: ${event}`);
  }

  if (!isValidTransition(currentStatus, next)) {
    throw new Error(
      `Invalid transition from "${currentStatus}" via event "${event}" → "${next}"`,
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
  // 1. admin-all: unrestricted access to all resources
  if (principal.role === "admin") {
    return true;
  }

  // 2. deny-identity-to-reviewer: hard deny, logged implicitly by call site
  if (principal.role === "reviewer" && resource === "ApplicantIdentity") {
    return false;
  }

  // 3. reviewer-blinded-assigned: read-only on BlindedPacket
  if (principal.role === "reviewer") {
    if (resource === "BlindedPacket" && action === "read") {
      return true;
    }
    return false;
  }

  // 4. applicant-own-proposals: read/write own Submission only
  if (principal.role === "applicant") {
    if (
      resource === "Submission" &&
      (action === "read" || action === "write") &&
      context?.ownerId === principal.userId
    ) {
      return true;
    }
    return false;
  }

  // 5. auditor: read-only AuditEvent
  if (principal.role === "auditor") {
    if (resource === "AuditEvent" && action === "read") {
      return true;
    }
    return false;
  }

  // 6. Default: deny
  return false;
}
