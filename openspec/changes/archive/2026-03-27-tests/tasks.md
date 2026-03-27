## Tests Tasks

### Unit — domain schemas
- [x] T0.1 Create `tests/unit/domainEntities.test.ts` — schema validation tests for all domain entities (Proposal, ProposalVersion, Submission, EligibilityResult, AuditEntry, User, Role)

### Unit — policy functions
- [x] T1.1 Create `tests/unit/eligibility.test.ts` — `evaluateEligibility` unit tests covering: eligible when all active rules pass; collects all failure reasons; respects active rule set; `not_applicable` treated as passing for `meetsEuropeanDimension`; `firstTimeApplicantInProgramme` rule
- [x] T1.2 Create `tests/unit/workflowTransitions.test.ts` — `isValidTransition` and `getNextStatus` unit tests covering: allowed transitions return true; disallowed transitions return false; event-to-status mapping for eligibility pass/fail
- [x] T1.3 Create `tests/unit/blindedPacket.test.ts` — `createBlindedPacket` golden test and traceability test; uses fixture at `tests/fixtures/blinded-packets/expected-blinded.json`
- [x] T1.4 Create `tests/unit/accessControl.test.ts` — role enforcement sweep across all protected routes; each route tested with no session (401), wrong-role session (403), allowed-role session (200/201/501)
- [x] T1.5 Create `tests/unit/dal.test.ts` — `verifySession` unit tests with mocked `getSession`; valid payload → Principal; null → null
- [x] T1.6 Create `tests/unit/intakeRoute.test.ts` — `POST /api/intake` route unit tests: 401 on missing session; 400 on invalid body; 201 and `submitProposal` called on valid request
- [x] T1.7 Create `tests/unit/eligibilityRoute.test.ts` — `POST /api/eligibility` route unit tests: 401 on missing session; 200 and `runEligibilityCheck` called on valid request
- [x] T1.8 Create `tests/unit/eligibilityFixtures.test.ts` — fixture-driven `evaluateEligibility` tests; reads all JSON files in `tests/fixtures/eligibility/`; adding a fixture automatically adds a test
- [x] T1.9 Create `tests/unit/authRoutes.test.ts` — auth route unit tests (`POST /api/auth/login`, `POST /api/auth/logout`)
- [x] T1.10 Create `tests/unit/proposalsRoute.test.ts` — proposals route unit tests (`GET /api/proposals`, `GET /api/proposals/[id]`)
- [x] T1.11 Create `tests/unit/auditRoute.test.ts` — audit route unit tests (`GET /api/audit`)
- [x] T1.12 Create `tests/unit/benchmarksRoute.test.ts` — benchmarks route unit tests (`GET /api/benchmarks`)
- [x] T1.13 Create `tests/unit/proposalActionsRoute.test.ts` — proposal actions route unit tests (`POST /api/proposals/[id]/actions`)

### Integration — mock (no DB)
- [x] T2.1 Create `tests/integration-mock/submitProposal.test.ts` — `submitProposal` service tests with `vitest-mock-extended` mocked Prisma
- [x] T2.2 Create `tests/integration-mock/eligibility.test.ts` — `runEligibilityCheck` service tests with mocked Prisma; covers eligible and ineligible paths

### Integration — real DB
- [x] T3.1 Create `tests/integration/submitProposal.test.ts` — `submitProposal` service integration tests with real Prisma + PostgreSQL; `beforeAll`/`afterAll` cleanup using `test-` alias prefix
- [x] T3.2 Create `tests/integration/eligibility.test.ts` — `runEligibilityCheck` integration tests with real DB

### E2e
- [x] T4.1 Create `tests/e2e/intakeToEligibility.test.ts` — HTTP e2e test: submit proposal via `POST /api/intake`, then trigger eligibility check via `POST /api/eligibility`; fail-fast if app unreachable
- [x] T4.2 Create `tests/e2e/authAndWorkflow.test.ts` — HTTP e2e test: login, access dashboard, submit proposal, logout; covers full auth + workflow path

### Fixtures
- [x] T5.1 Create `tests/fixtures/eligibility/all-pass.json` — all rules active, all inputs pass; `expectedStatus: "eligible"`, `expectedFailureReasons: []`
- [x] T5.2 Create `tests/fixtures/eligibility/language-fail.json` — `submittedInEnglish: false`; `expectedStatus: "ineligible"`, `expectedFailureReasons: ["submittedInEnglish"]`
- [x] T5.3 Create `tests/fixtures/eligibility/multiple-fail.json` — multiple failing rules; `expectedFailureReasons` lists all failing rule names
- [x] T5.4 Create `tests/fixtures/blinded-packets/expected-blinded.json` — golden fixture with `mustContain` and `mustExclude` field lists for `createBlindedPacket` output
