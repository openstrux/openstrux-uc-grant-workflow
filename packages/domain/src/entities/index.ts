/**
 * TypeScript entity interfaces re-exported from domain Zod schema types.
 *
 * Use these for type annotations throughout the codebase.
 * Never define these manually — always use z.infer from the Zod schemas.
 */

export type {
  Submission,
  ProposalVersion,
  EligibilityInputs,
  AuditEvent,
  IntakeRequest,
  IntakeResponse,
  EligibilityRequest,
  EligibilityResponse,
} from "../schemas/index";
