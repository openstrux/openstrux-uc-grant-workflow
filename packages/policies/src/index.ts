/**
 * @grant-workflow/policies — real implementation.
 *
 * Pure business-logic functions. No database access.
 */

// ---------------------------------------------------------------------------
// Types (inline to avoid circular deps across packages)
// ---------------------------------------------------------------------------

export interface EligibilityInputs {
  submittedInEnglish: boolean;
  alignedWithCall: boolean;
  primaryObjectiveIsRd: boolean;
  meetsEuropeanDimension: "true" | "false" | "not_applicable";
  requestedBudgetKEur: number;
  firstTimeApplicantInProgramme: boolean;
}

export interface EligibilityResult {
  status: "eligible" | "ineligible";
  failureReasons: string[];
  inputs: EligibilityInputs;
  activeRules: string[];
}

export interface ProposalVersion {
  id: string;
  submissionId: string;
  versionNumber: number;
  isEffective: boolean;
  title: string;
  abstract: string;
  requestedBudgetKEur: number;
  budgetUsage: string;
  tasksBreakdown: string;
}

export interface BlindedPacketContent {
  title: string;
  abstract: string;
  requestedBudgetKEur: number;
  budgetUsage: string;
  tasksBreakdown: string;
}

export interface BlindedPacketData {
  proposalVersionId: string;
  content: BlindedPacketContent;
}

export interface ApplicantIdentityData {
  id: string;
  submissionId: string;
  legalName: string;
  email: string;
  country: string;
  organisation: string;
}

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

// ---------------------------------------------------------------------------
// Eligibility evaluation
// ---------------------------------------------------------------------------

const BUDGET_LIMIT_K_EUR = 500;

/**
 * Evaluate eligibility inputs against the active rule set.
 * Only rules present in activeRules are checked.
 */
export function evaluateEligibility(
  inputs: EligibilityInputs,
  activeRules: string[],
): EligibilityResult {
  const failureReasons: string[] = [];

  if (activeRules.includes("submittedInEnglish") && !inputs.submittedInEnglish) {
    failureReasons.push("submittedInEnglish");
  }

  if (activeRules.includes("alignedWithCall") && !inputs.alignedWithCall) {
    failureReasons.push("alignedWithCall");
  }

  if (activeRules.includes("primaryObjectiveIsRd") && !inputs.primaryObjectiveIsRd) {
    failureReasons.push("primaryObjectiveIsRd");
  }

  if (
    activeRules.includes("meetsEuropeanDimension") &&
    inputs.meetsEuropeanDimension === "false"
  ) {
    failureReasons.push("meetsEuropeanDimension");
  }

  if (
    activeRules.includes("requestedBudgetKEur") &&
    inputs.requestedBudgetKEur > BUDGET_LIMIT_K_EUR
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
// Blinded packet creation
// ---------------------------------------------------------------------------

/**
 * Create a blinded (identity-stripped) packet from a proposal version.
 * Content contains evaluable fields only — no identity data.
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

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted"],
  submitted: ["eligible", "eligibility_failed"],
  eligible: ["under_review"],
  under_review: ["clarification_requested", "validation_pending", "rejected"],
  clarification_requested: ["revised"],
  revised: ["under_review"],
  validation_pending: ["selected", "rejected"],
  eligibility_failed: [],
  selected: [],
  rejected: [],
};

/**
 * Check whether a status transition is valid per workflow-states.md.
 */
export function isValidTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/**
 * Derive the next submission status from the current status and a domain event.
 */
export function getNextStatus(currentStatus: string, event: string): string {
  if (currentStatus === "submitted" && event === "eligibility_pass") return "eligible";
  if (currentStatus === "submitted" && event === "eligibility_fail") return "eligibility_failed";
  throw new Error(`No transition defined for status=${currentStatus} event=${event}`);
}

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------

/**
 * Enforce access policies from access-policies.md.
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
  if (principal.role === "reviewer" && resource === "ApplicantIdentity") return false;

  // Rule 3: reviewer-blinded-assigned — reviewer may only read BlindedPacket
  if (principal.role === "reviewer") {
    return resource === "BlindedPacket" && action === "read";
  }

  // Rule 4: applicant-own-proposals
  if (principal.role === "applicant") {
    if (resource !== "Submission") return false;
    if (action === "delete") return false;
    return context?.ownerId === principal.userId;
  }

  // Rule 5: auditor — read-only AuditEvent
  if (principal.role === "auditor") {
    return resource === "AuditEvent" && action === "read";
  }

  // Rule 6: validator — stub (P5+), deny by default
  return false;
}
