/**
 * @grant-workflow/policies — barrel re-export.
 *
 * All policy implementations live in packages/policies/src/index.ts.
 * This file re-exports them so src-relative imports also resolve.
 */

export {
  evaluateEligibility,
  createBlindedPacket,
  isValidTransition,
  getNextStatus,
  checkAccess,
} from "../../packages/policies/src/index";

export type {
  EligibilityResult,
  EligibilityInputs,
  ProposalVersion,
  BlindedPacketContent,
  BlindedPacketData,
  ApplicantIdentityData,
  AccessPrincipal,
  ResourceType,
} from "../../packages/policies/src/index";
