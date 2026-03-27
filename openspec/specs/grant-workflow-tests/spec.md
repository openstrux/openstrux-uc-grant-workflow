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

### Requirement: Unit tests cover auth route contract (login, logout, register)
The test suite SHALL include unit tests for `POST /api/auth/login`, `POST /api/auth/logout`, and `POST /api/auth/register`. `createSession` and `deleteSession` SHALL be mocked; bcryptjs SHALL be mocked to keep tests fast. No database required.

#### Scenario: Login returns 400 for invalid body
- **WHEN** a POST to `/api/auth/login` is missing email or password, or email is not a valid format
- **THEN** the response status is `400`

#### Scenario: Login returns 401 for unknown email or wrong password
- **WHEN** a POST to `/api/auth/login` uses an email not in DEV_USERS or a password that fails bcrypt comparison
- **THEN** the response status is `401`

#### Scenario: Login returns 200 and calls createSession for valid credentials
- **WHEN** a POST to `/api/auth/login` uses a known email and a password that passes bcrypt comparison
- **THEN** the response status is `200`, the body contains `{ userId, role }`, and `createSession` is called once

#### Scenario: Logout returns 303 and calls deleteSession
- **WHEN** a POST to `/api/auth/logout` is made
- **THEN** the response status is `303` (redirect to `/`) and `deleteSession` is called once

#### Scenario: Register returns 400 for invalid body
- **WHEN** a POST to `/api/auth/register` is missing required fields, has an invalid email, password shorter than 8 characters, budget ≤ 0, or `privacyPolicy` is not `true`
- **THEN** the response status is `400`

#### Scenario: Register returns 201 with userId and submissionId for valid body
- **WHEN** a POST to `/api/auth/register` contains all required fields with valid values
- **THEN** the response status is `201`, the body contains `{ userId, submissionId }`, and `createSession` is called with role `"applicant"`

#### Scenario: Register returns 409 on duplicate email
- **WHEN** a POST to `/api/auth/register` uses an email already registered in the current process lifetime
- **THEN** the response status is `409`

---

### Requirement: Unit tests cover new stub route contracts (proposals, audit, benchmarks, proposal actions)
The test suite SHALL include unit tests for each route added in the frontend overhaul: `GET /api/proposals`, `GET /api/proposals/[id]`, `GET /api/audit`, `GET /api/benchmarks`, `POST /api/proposals/[id]/assign`, `POST /api/proposals/[id]/review`, and `POST /api/proposals/[id]/validate`. `verifySession` SHALL be mocked via `../../src/lib/dal`. No database required.

#### Scenario: Unauthenticated request returns 401
- **WHEN** `verifySession` returns `null` for any of these routes
- **THEN** the response status is `401`

#### Scenario: Wrong-role request returns 403
- **WHEN** `verifySession` returns a principal whose role is not in the allowed set for a given route
- **THEN** the response status is `403`

#### Scenario: Authorised request to stub route returns expected status
- **WHEN** `verifySession` returns an allowed principal for GET `/api/proposals`, GET `/api/proposals/[id]`, GET `/api/audit`
- **THEN** the response status is `200` and the body is an array or null respectively

#### Scenario: Proposal action stub returns 501 for valid authorised request
- **WHEN** `verifySession` returns an allowed principal and the body passes schema validation for `/api/proposals/[id]/assign`, `/review`, or `/validate`
- **THEN** the response status is `501`

#### Scenario: Proposal action returns 400 for invalid body
- **WHEN** `verifySession` returns an allowed principal but the body fails schema validation (missing field, empty string, invalid enum value)
- **THEN** the response status is `400`

#### Scenario: Benchmarks route returns 200 with empty array when results directory is absent
- **WHEN** `fs.readdir` throws ENOENT
- **THEN** the response status is `200` and the body is `[]`

#### Scenario: Benchmarks route parses generation-meta.json and test-unit.json
- **WHEN** valid result directories exist with matching JSON files
- **THEN** the response contains parsed `BenchmarkResult[]` sorted by date descending

---

### Requirement: E2e tests verify the full intake-to-eligibility workflow over HTTP
The test suite SHALL include end-to-end tests that POST to `/api/intake` and `/api/eligibility` against a running app and verify HTTP response status and response shape. Both routes require authentication — tests SHALL log in as admin (permitted for both routes) in `beforeAll` and pass the session cookie with each request.

#### Scenario: POST /api/intake returns 201 with submissionId
- **WHEN** a valid intake payload is POSTed to `/api/intake` with a valid admin session cookie
- **THEN** the response status is `201` and the body contains a `submissionId`

#### Scenario: POST /api/eligibility transitions submission to eligible
- **WHEN** a valid eligibility payload is POSTed to `/api/eligibility` with a valid admin session cookie
- **THEN** the response status is `200` and the body contains `status: "eligible"`

#### Scenario: E2e tests fail fast when app is not reachable
- **WHEN** the app is not running at `APP_URL`
- **THEN** the test suite fails in `beforeAll` with a clear error message

---

### Requirement: E2e tests verify auth flow and role-gated route access
The test suite SHALL include end-to-end tests in `tests/e2e/authAndWorkflow.test.ts` that test the complete authentication flow and role-based access control against a running app. Tests SHALL extract the `set-cookie` response header from login and pass it as a `Cookie` request header to subsequent calls.

#### Scenario: Login returns session cookie for valid credentials
- **WHEN** POST `/api/auth/login` is called with valid dev credentials
- **THEN** the response is `200`, the body contains `{ userId, role }`, and a `session=` cookie is set

#### Scenario: Login returns 401 for wrong password or unknown user
- **WHEN** POST `/api/auth/login` is called with incorrect credentials
- **THEN** the response is `401`

#### Scenario: Logout returns 303 redirect
- **WHEN** POST `/api/auth/logout` is called with a valid session cookie
- **THEN** the response is `303`

#### Scenario: Role-gated routes enforce access with real session cookie
- **WHEN** a request to `/api/proposals`, `/api/audit`, or a proposal action route is made with a session cookie for an unauthorised role
- **THEN** the response is `403`

#### Scenario: Allowed-role request to role-gated route succeeds
- **WHEN** a request is made with a session cookie for an authorised role
- **THEN** the response is `200` (list routes) or `501` (action stubs)

#### Scenario: Unauthenticated request returns 401
- **WHEN** a request is made to any protected route without a session cookie
- **THEN** the response is `401`

#### Scenario: Public benchmarks endpoint requires no auth
- **WHEN** GET `/api/benchmarks` is called without any session cookie
- **THEN** the response is `200`

---

### Requirement: All tests import only from contract surfaces
No test file SHALL import from internal modules within `src/policies/`, `src/domain/`, or any `packages/*/src/internal/` path.

#### Scenario: Import path is a contract surface
- **WHEN** a test file is written
- **THEN** all imports resolve to: `src/domain/schemas`, `packages/policies/src` (barrel), `src/server/services/*`, `src/lib/dal`, or `@prisma/client`
