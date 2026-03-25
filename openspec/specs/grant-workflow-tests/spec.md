### Requirement: Unit tests cover domain schemas
The test suite SHALL include unit tests for all Zod schemas exported from `src/domain/schemas`. Tests SHALL verify valid inputs are accepted and invalid inputs are rejected.

#### Scenario: Valid entity accepted
- **WHEN** a well-formed entity object is parsed against its schema
- **THEN** `safeParse` returns `success: true`

#### Scenario: Invalid field rejected
- **WHEN** a required field is missing or has an invalid value (e.g. unknown status, negative budget, wrong enum)
- **THEN** `safeParse` returns `success: false`

---

### Requirement: Unit tests cover pure policy functions
The test suite SHALL include unit tests for all functions exported from the policies barrel (`packages/policies/src`). Tests SHALL not import from internal policy modules.

#### Scenario: evaluateEligibility returns eligible when all active rules pass
- **WHEN** all active rule inputs are valid
- **THEN** `evaluateEligibility` returns `{ status: "eligible", failureReasons: [] }`

#### Scenario: evaluateEligibility collects all failure reasons
- **WHEN** multiple active rule inputs fail
- **THEN** `evaluateEligibility` returns `status: "ineligible"` with all failing rule names in `failureReasons`

#### Scenario: evaluateEligibility respects active rule set
- **WHEN** a rule is not in the active rules list
- **THEN** its input value does not affect the result

#### Scenario: not_applicable is treated as passing for meetsEuropeanDimension
- **WHEN** `meetsEuropeanDimension` is `"not_applicable"`
- **THEN** that criterion does not contribute a failure reason

---

### Requirement: Integration tests verify service layer against real database
The test suite SHALL include integration tests for `submitProposal` and `runEligibilityCheck` that verify persisted state via Prisma. Tests SHALL clean up test data by alias prefix in `beforeAll`/`afterAll`.

#### Scenario: submitProposal persists submission and proposal version
- **WHEN** `submitProposal` is called with valid intake data
- **THEN** a `Submission` row exists in the database with `status: "submitted"`

#### Scenario: submitProposal creates a blinded packet without identity fields
- **WHEN** `submitProposal` completes
- **THEN** a `BlindedPacket` exists whose `content` does not contain identity fields (`applicantIdentity`, `legalName`, `email`)

#### Scenario: submitProposal writes an audit event
- **WHEN** `submitProposal` completes
- **THEN** an `AuditEvent` with `eventType: "submission.created"` exists for the submission

#### Scenario: runEligibilityCheck records result and transitions status
- **WHEN** `runEligibilityCheck` is called with passing inputs
- **THEN** the submission status transitions to `"eligible"` and an `EligibilityRecord` is persisted

---

### Requirement: Integration-mock suite provides DB-free coverage
The test suite SHALL include a mock-based integration suite in `tests/integration-mock/` using `vitest-mock-extended`. It SHALL cover the same scenarios as the real integration suite without requiring a database connection.

#### Scenario: Mock suite runs without DATABASE_URL
- **WHEN** `pnpm test:integration:mock` is executed without a database
- **THEN** all mock integration tests pass

---

### Requirement: E2e tests verify the full intake-to-eligibility workflow over HTTP
The test suite SHALL include end-to-end tests that POST to `/api/intake` and `/api/eligibility` against a running app and verify HTTP response status and response shape.

#### Scenario: POST /api/intake returns 201 with submissionId
- **WHEN** a valid intake payload is POSTed to `/api/intake`
- **THEN** the response status is `201` and the body contains a `submissionId`

#### Scenario: POST /api/eligibility transitions submission to eligible
- **WHEN** a valid eligibility payload is POSTed to `/api/eligibility` for an existing submission
- **THEN** the response status is `200` and the body contains `status: "eligible"`

#### Scenario: E2e tests fail fast when app is not reachable
- **WHEN** the app is not running at `APP_URL`
- **THEN** the test suite fails in `beforeAll` with a clear error message

---

### Requirement: All tests import only from contract surfaces
No test file SHALL import from internal modules within `src/policies/`, `src/domain/`, or any `packages/*/src/internal/` path.

#### Scenario: Import path is a contract surface
- **WHEN** a test file is written
- **THEN** all imports resolve to: `src/domain/schemas`, `packages/policies/src` (barrel), `src/server/services/*`, `src/lib/dal`, or `@prisma/client`
