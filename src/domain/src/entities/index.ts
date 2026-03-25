/**
 * TypeScript entity interfaces — re-exported from domain schema types.
 * All types derive from Zod schemas via z.infer<>.
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
} from "../../schemas/index";
