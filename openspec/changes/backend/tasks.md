# Backend Implementation Tasks

## Task Checklist

- [x] T01: Create `prisma/schema.prisma` — all models (User, Call, Submission, ProposalVersion, ApplicantIdentity, BlindedPacket, EligibilityRecord, AuditEvent) with correct relations and cascade deletes
- [x] T02: Create `prisma/seeds/seed.ts` — seed 5 dev users (bcrypt) + default Call with all 6 eligibility checks
- [x] T03: Create `src/lib/prisma.ts` — PrismaClient singleton
- [x] T04: Implement `src/policies/index.ts` — evaluateEligibility, MVP_DEFAULT_RULES, createBlindedPacket, isValidTransition, getNextStatus, checkAccess (remove @generated-stub)
- [x] T05: Update `packages/policies/src/index.ts` — remove @generated-stub marker (already re-exports correctly)
- [x] T06: Update `src/domain/schemas/index.ts` — remove @generated-stub marker (schema content already correct)
- [x] T07: Implement `src/server/services/submissionService.ts` — submitProposal (atomic transaction), listSubmissions, getSubmission
- [x] T08: Implement `src/server/services/eligibilityService.ts` — runEligibilityCheck (evaluate → persist EligibilityRecord → update Submission status → audit event)
- [x] T09: Implement `src/app/api/intake/route.ts` — replace 501 stub with submitProposal call
- [x] T10: Implement `src/app/api/eligibility/route.ts` — replace 501 stub with runEligibilityCheck call
- [x] T11: Run `pnpm test:unit` — 180/180 passed
- [x] T12: Run `pnpm test:integration:mock` — 7/7 passed
- [x] T13: Run `tsc --noEmit` — exit 0, no errors
