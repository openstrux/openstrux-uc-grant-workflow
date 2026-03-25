## Tests Tasks

### Unit — domain schemas

- [x] T0.1 Create `tests/unit/domainEntities.test.ts` — contract tests for `SubmissionSchema`, `ProposalVersionSchema`, `EligibilityInputsSchema`, `AuditEventSchema`, `IntakeRequestSchema`, `EligibilityRequestSchema`, `EligibilityResponseSchema`

### Unit — policy functions

- [x] T1.1 Create `tests/unit/eligibility.test.ts` — contract tests for `evaluateEligibility`: all-pass, single-field failures, multi-failure, active-rule-set filtering, `not_applicable` handling, result shape
- [x] T1.2 Create `tests/unit/workflowTransitions.test.ts` — contract tests for `isValidTransition` and `getNextStatus`
- [x] T1.3 Create `tests/unit/blindedPacket.test.ts` — contract tests for `createBlindedPacket`: identity fields absent, content fields preserved
- [x] T1.4 Create `tests/unit/accessControl.test.ts` — contract tests for access control policy functions
- [x] T1.5 Create `tests/unit/dal.test.ts` — contract tests for `verifySession` from `src/lib/dal`
- [x] T1.6 Create `tests/unit/intakeRoute.test.ts` — unit tests for the intake route handler
- [x] T1.7 Create `tests/unit/eligibilityRoute.test.ts` — unit tests for the eligibility route handler
- [x] T1.8 Create `tests/unit/eligibilityFixtures.test.ts` — golden/fixture tests for eligibility edge cases

### Integration — real DB

- [x] T2.1 Create `tests/integration/intake.test.ts` — `submitProposal`: persists submission + version, creates blinded packet without identity fields, writes audit event; cleans up by `test-` alias prefix
- [x] T2.2 Create `tests/integration/eligibility.test.ts` — `runEligibilityCheck`: persists `EligibilityRecord`, transitions submission status, writes audit event

### Integration — mock (no DB)

- [x] T3.1 Create `tests/integration-mock/setup.ts` — shared mock setup using `vitest-mock-extended`
- [x] T3.2 Create `tests/integration-mock/intake.test.ts` — same scenarios as `T2.1` using mocked Prisma client
- [x] T3.3 Create `tests/integration-mock/eligibility.test.ts` — same scenarios as `T2.2` using mocked Prisma client

### E2e

- [x] T4.1 Create `tests/e2e/intakeToEligibility.test.ts` — POST `/api/intake` → assert 201 + `submissionId`; POST `/api/eligibility` → assert 200 + `status: "eligible"`; fail-fast guard if app not reachable

### Fixtures

- [x] T5.1 Create `tests/fixtures/` — shared test data (valid intake payloads, eligibility inputs, expected responses)
