/**
 * eligibilityService — service-layer contract for eligibility checks.
 *
 * Called by the POST /api/eligibility route handler.
 * Orchestrates: evaluate → persist EligibilityRecord → transition status → audit event.
 * All types derive from @grant-workflow/domain schemas.
 *
 * @generated-stub — replace with real implementation via backend generation
 */

import type {
  EligibilityRequest,
  EligibilityResponse,
} from "../../../../../packages/domain/src/schemas";

/**
 * Run a full eligibility check: evaluate inputs against the call's active
 * rule set, persist the EligibilityRecord, transition the submission status,
 * and create an audit event.
 */
export async function runEligibilityCheck(
  _request: EligibilityRequest,
): Promise<EligibilityResponse> {
  throw new Error("Not implemented — replace via backend generation");
}
