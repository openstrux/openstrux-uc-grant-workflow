## MODIFIED Requirements

### Requirement: Unit tests cover pure policy functions
The test suite SHALL include unit tests for all functions exported from the policies barrel (`packages/policies/src`). Tests SHALL not import from internal policy modules. Coverage MUST include `evaluateEligibility`, `createBlindedPacket`, `isValidTransition`, and `getNextStatus`.

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

#### Scenario: createBlindedPacket excludes identity fields (golden test)
- **WHEN** `createBlindedPacket` is called with a proposal version and applicant identity
- **THEN** the returned packet's `content` contains all fields listed in `tests/fixtures/blinded-packets/expected-blinded.json` `mustContain` and none in `mustExclude`

#### Scenario: createBlindedPacket preserves traceability via proposalVersionId only
- **WHEN** `createBlindedPacket` returns a packet
- **THEN** `packet.proposalVersionId` is set and `packet.content` does not contain `submissionId` or `proposalVersionId`

#### Scenario: isValidTransition allows only permitted state changes
- **WHEN** `isValidTransition` is called with a permitted pair (e.g. `draft → submitted`, `submitted → eligible`)
- **THEN** it returns `true`

#### Scenario: isValidTransition rejects invalid transitions
- **WHEN** `isValidTransition` is called with a disallowed pair (e.g. `eligibility_failed → under_review`, `draft → eligible`)
- **THEN** it returns `false`

#### Scenario: getNextStatus maps eligibility events to correct status
- **WHEN** `getNextStatus("submitted", "eligibility_pass")` is called
- **THEN** it returns `"eligible"`

#### Scenario: getNextStatus maps eligibility failure event
- **WHEN** `getNextStatus("submitted", "eligibility_fail")` is called
- **THEN** it returns `"eligibility_failed"`

### Requirement: Unit tests cover intake and eligibility route contracts
The test suite SHALL include unit tests for `POST /api/intake` and `POST /api/eligibility`. `verifySession` and the underlying service functions SHALL be mocked. No database required.

#### Scenario: POST /api/intake returns 401 when session is missing
- **WHEN** `verifySession` returns `null`
- **THEN** the intake route returns HTTP 401

#### Scenario: POST /api/intake returns 400 for invalid body
- **WHEN** the request body fails `IntakeRequestSchema` validation
- **THEN** the response status is `400`

#### Scenario: POST /api/intake calls submitProposal for valid authorised request
- **WHEN** `verifySession` returns a valid principal and the body passes schema validation
- **THEN** `submitProposal` is called and the response status is `201`

#### Scenario: POST /api/eligibility returns 401 when session is missing
- **WHEN** `verifySession` returns `null`
- **THEN** the eligibility route returns HTTP 401

#### Scenario: POST /api/eligibility calls runEligibilityCheck for valid authorised request
- **WHEN** `verifySession` returns a valid principal and the body passes schema validation
- **THEN** `runEligibilityCheck` is called and the response status is `200`

### Requirement: Unit tests cover access control across all protected routes
The test suite SHALL include unit tests in `tests/unit/accessControl.test.ts` that verify role enforcement is consistent across all protected API routes. Each route MUST be tested with: no session (expect 401), session with wrong role (expect 403), and session with allowed role (expect 200 or 201 or 501).

#### Scenario: Every protected route rejects missing session
- **WHEN** `verifySession` returns `null` for any protected route
- **THEN** the response status is `401`

#### Scenario: Every protected route rejects wrong-role session
- **WHEN** `verifySession` returns a principal with a role not in the route's allowed set
- **THEN** the response status is `403`

### Requirement: Unit tests cover DAL verifySession behaviour
The test suite SHALL include unit tests in `tests/unit/dal.test.ts` for the `verifySession` function. `getSession` from `src/lib/session` SHALL be mocked.

#### Scenario: verifySession returns Principal when getSession returns valid payload
- **WHEN** `getSession` returns `{ userId, role }`
- **THEN** `verifySession` returns a `Principal` with matching fields

#### Scenario: verifySession returns null when getSession returns null
- **WHEN** `getSession` returns `null`
- **THEN** `verifySession` returns `null`

### Requirement: Fixture-driven eligibility unit tests
The test suite SHALL include `tests/unit/eligibilityFixtures.test.ts` that drives `evaluateEligibility` against all JSON files in `tests/fixtures/eligibility/`. Each fixture file specifies `inputs`, `activeRules`, `expectedStatus`, and `expectedFailureReasons`. Adding a new fixture file automatically adds a test case with no code change.

#### Scenario: all-pass fixture produces eligible result
- **WHEN** the `all-pass.json` fixture is evaluated
- **THEN** `status` is `"eligible"` and `failureReasons` is empty

#### Scenario: language-fail fixture produces ineligible with submittedInEnglish failure
- **WHEN** the `language-fail.json` fixture is evaluated
- **THEN** `status` is `"ineligible"` and `failureReasons` contains `"submittedInEnglish"`

#### Scenario: multiple-fail fixture produces all expected failure reasons
- **WHEN** the `multiple-fail.json` fixture is evaluated
- **THEN** `failureReasons` contains all entries listed in the fixture's `expectedFailureReasons`
