/**
 * Domain entity TypeScript interfaces — re-exported from Zod schema types.
 * Never define types manually; always use z.infer<> via the schemas barrel.
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
} from "../schemas";

export { ProposalStatus } from "../schemas";
