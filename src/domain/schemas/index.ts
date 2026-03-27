/**
 * Domain Zod schemas — single source of truth for all data shapes.
 *
 * Both front-end and back-end import from here.
 * Field names use camelCase (TypeScript convention).
 * All types are derived via z.infer<> — never duplicated manually.
 *
 * @generated-stub — replace with real implementation via backend generation
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export const ProposalStatus = z.enum([
  "draft",
  "submitted",
  "eligibility_failed",
  "eligible",
  "under_review",
  "clarification_requested",
  "revised",
  "validation_pending",
  "selected",
  "rejected",
]);

// ---------------------------------------------------------------------------
// Entity schemas
// ---------------------------------------------------------------------------

export const SubmissionSchema = z.object({
  id: z.string(),
  callId: z.string(),
  applicantAlias: z.string().min(1),
  status: ProposalStatus,
  submittedAt: z.string().datetime().or(z.string()),
});

export const ProposalVersionSchema = z.object({
  id: z.string(),
  submissionId: z.string(),
  versionNumber: z.number().int().positive(),
  isEffective: z.boolean(),
  title: z.string().min(1),
  abstract: z.string().min(1),
  requestedBudgetKEur: z.number().nonnegative(),
  budgetUsage: z.string().min(1),
  tasksBreakdown: z.string().min(1),
});

export const EligibilityInputsSchema = z.object({
  submittedInEnglish: z.boolean(),
  alignedWithCall: z.boolean(),
  primaryObjectiveIsRd: z.boolean(),
  meetsEuropeanDimension: z.enum(["true", "false", "not_applicable"]),
  requestedBudgetKEur: z.number(),
  firstTimeApplicantInProgramme: z.boolean(),
});

export const AuditEventSchema = z.object({
  id: z.string(),
  eventType: z.string(),
  actorId: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  payload: z.record(z.unknown()),
  timestamp: z.string().datetime().or(z.string()),
});

// ---------------------------------------------------------------------------
// API request / response schemas
// ---------------------------------------------------------------------------

/** POST /api/intake — request body */
export const IntakeRequestSchema = z.object({
  callId: z.string().min(1),
  applicantAlias: z.string().min(1),
  // Proposal content
  title: z.string().min(1),
  abstract: z.string().min(1),
  requestedBudgetKEur: z.number().positive(),
  budgetUsage: z.string().min(1),
  tasksBreakdown: z.string().min(1),
  // Applicant identity (stored separately in ApplicantIdentity — restricted access)
  legalName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  country: z.string().min(1).optional(),
  organisation: z.string().min(1).optional(),
});

/** POST /api/intake — 201 response */
export const IntakeResponseSchema = z.object({
  submissionId: z.string(),
});

/** POST /api/eligibility — request body */
export const EligibilityRequestSchema = z.object({
  submissionId: z.string().min(1),
  inputs: EligibilityInputsSchema,
});

/** POST /api/eligibility — 200 response */
export const EligibilityResponseSchema = z.object({
  status: z.enum(["eligible", "ineligible"]),
  failureReasons: z.array(z.string()),
});

/** POST /api/auth/login — request body */
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** POST /api/auth/register — request body */
export const RegisterRequestSchema = z.object({
  // Contact information
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  organisation: z.string().min(1),
  country: z.string().min(1),
  website: z.string().url().optional().or(z.literal("")),
  // Project information
  callId: z.string().min(1),
  title: z.string().min(1),
  abstract: z.string().min(1),
  requestedBudgetKEur: z.number().positive(),
  budgetUsage: z.string().min(1),
  tasksBreakdown: z.string().min(1),
  // Account creation
  password: z.string().min(8),
  privacyPolicy: z.literal(true),
});

// ---------------------------------------------------------------------------
// Derived types (never define these manually — always use z.infer)
// ---------------------------------------------------------------------------

export type Submission = z.infer<typeof SubmissionSchema>;
export type ProposalVersion = z.infer<typeof ProposalVersionSchema>;
export type EligibilityInputs = z.infer<typeof EligibilityInputsSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type IntakeRequest = z.infer<typeof IntakeRequestSchema>;
export type IntakeResponse = z.infer<typeof IntakeResponseSchema>;
export type EligibilityRequest = z.infer<typeof EligibilityRequestSchema>;
export type EligibilityResponse = z.infer<typeof EligibilityResponseSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
