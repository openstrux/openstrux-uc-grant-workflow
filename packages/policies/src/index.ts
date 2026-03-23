/**
 * @grant-workflow/policies — public contract.
 *
 * Exports pure business-logic functions that route handlers, services,
 * and tests depend on. Internal file structure is free — the generated
 * backend may organise code however it likes as long as these exports
 * resolve with the correct signatures.
 *
 * All input/output types derive from @grant-workflow/domain schemas.
 *
 * @generated-stub — replace with real implementation via backend generation
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
  _inputs: EligibilityInputs,
  _activeRules: string[],
): EligibilityResult {
  throw new Error("Not implemented — replace via backend generation");
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
  _proposalVersion: ProposalVersion,
  _applicantIdentity: ApplicantIdentityData,
): BlindedPacketData {
  throw new Error("Not implemented — replace via backend generation");
}

// ---------------------------------------------------------------------------
// Workflow state transitions (pure — no DB)
// ---------------------------------------------------------------------------

/**
 * Check whether a status transition is valid per specs/workflow-states.md.
 */
export function isValidTransition(_from: string, _to: string): boolean {
  throw new Error("Not implemented — replace via backend generation");
}

/**
 * Derive the next submission status from the current status and a domain event.
 *
 * Events: "eligibility_pass" → "eligible", "eligibility_fail" → "eligibility_failed".
 */
export function getNextStatus(_currentStatus: string, _event: string): string {
  throw new Error("Not implemented — replace via backend generation");
}
