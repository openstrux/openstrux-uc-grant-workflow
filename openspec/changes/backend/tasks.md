## 0. Baseline corrections (GAP-001)

Apply before or alongside generation — these are pre-existing test/fixture files, not generated code.

- [ ] 0.1 `tests/unit/eligibility.test.ts` — add `"firstTimeApplicantInProgramme"` to `ALL_RULES`; add test: `"returns ineligible when firstTimeApplicantInProgramme is false"`; add test: `"does not fail firstTimeApplicantInProgramme when not in active rules"`
- [ ] 0.2 `tests/integration-mock/eligibility.test.ts` — in the `"updates submission status to eligible on pass"` test, change `firstTimeApplicantInProgramme: false` → `true`
- [ ] 0.3 `tests/fixtures/eligibility/all-pass.json` — add `"firstTimeApplicantInProgramme"` to `activeRules`
- [ ] 0.4 `tests/fixtures/eligibility/language-fail.json` — add `"firstTimeApplicantInProgramme"` to `activeRules`
- [ ] 0.5 `tests/fixtures/eligibility/multiple-fail.json` — add `"firstTimeApplicantInProgramme"` to `activeRules`

## 1. Domain model

- [ ] 1.1 Write `prisma/schema.prisma` — models: `User`, `Call`, `Submission`, `ProposalVersion`, `ApplicantIdentity`, `BlindedPacket`, `EligibilityRecord`, `AuditEvent`; all child models use `onDelete: Cascade` on their `Submission` relation
- [ ] 1.2 Write `src/lib/prisma.ts` — singleton `PrismaClient` instance (process-scoped, dev-safe)
- [ ] 1.3 Implement `src/domain/schemas/index.ts` — replace stubs with real Zod schemas; `IntakeRequestSchema` identity fields (`legalName`, `email`, `country`, `organisation`) must be **optional**

## 2. Policy functions

- [ ] 2.1 Implement `evaluateEligibility` in `src/policies/index.ts` — pure function; evaluates inputs against `activeRules`; returns `{ status, failureReasons, inputs, activeRules }`; handles all 6 MVP checks including `firstTimeApplicantInProgramme`
- [ ] 2.2 Implement `createBlindedPacket` — strip identity fields from proposal content; read `tests/unit/blindedPacket.test.ts` for exact field list
- [ ] 2.3 Implement `isValidTransition` and `getNextStatus` — per `openspec/specs/workflow-states.md`
- [ ] 2.4 Ensure `packages/policies/src/index.ts` re-exports everything from `src/policies/index.ts`

## 3. Services

- [ ] 3.1 Implement `submitProposal` in `src/server/services/submissionService.ts` — create `Submission`, `ProposalVersion`, `BlindedPacket`, and `AuditEvent` atomically
- [ ] 3.2 Implement `runEligibilityCheck` in `src/server/services/eligibilityService.ts` — persist `EligibilityRecord`, transition submission status, write audit event; derive `activeRules` from `Call.enabledEligibilityChecks`; fall back to `MVP_DEFAULT_RULES` (6 checks) if call not found

## 4. API routes

- [ ] 4.1 Implement `src/app/api/intake/route.ts` — replace stub: `verifySession` → 401/403 → validate with `IntakeRequestSchema` → `submitProposal`
- [ ] 4.2 Implement `src/app/api/eligibility/route.ts` — replace stub: `verifySession` → 401/403 → validate with `EligibilityRequestSchema` → `runEligibilityCheck`

## 5. Seed

- [ ] 5.1 Write `prisma/seeds/seed.ts` — upsert one `User` per role and the default `Call` per `openspec/specs/access-policies.md §Dev fixtures`; `Call.enabledEligibilityChecks` must include all 6 MVP checks; use placeholder string for `passwordHash` (never import `bcrypt`); idempotent

## 6. Verification

- [ ] 6.1 `tsc --noEmit` exits 0 at the project root
- [ ] 6.2 All unit tests in `tests/unit/` pass (`pnpm test:unit`)
- [ ] 6.3 All tests in `tests/integration-mock/` pass (`pnpm test:integration:mock`, no DB required)
- [ ] 6.4 All integration tests in `tests/integration/` pass (`pnpm test:integration`, requires `DATABASE_URL`)
