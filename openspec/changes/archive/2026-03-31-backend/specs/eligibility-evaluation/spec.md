## ADDED Requirements

### Requirement: Pure eligibility evaluation function
The system SHALL export a pure function `evaluateEligibility(inputs, activeRules)` that evaluates a set of eligibility inputs against a caller-supplied active rule list and returns a result object containing `status`, `failureReasons`, `inputs`, and `activeRules`.

#### Scenario: All active rules pass
- **WHEN** all inputs satisfy every rule in `activeRules`
- **THEN** result `status` is `"eligible"` and `failureReasons` is empty

#### Scenario: Single rule fails
- **WHEN** one input violates its rule and that rule is in `activeRules`
- **THEN** result `status` is `"ineligible"` and `failureReasons` contains exactly that rule name

#### Scenario: Multiple rules fail
- **WHEN** more than one input violates their respective rules
- **THEN** `failureReasons` contains all failing rule names and `status` is `"ineligible"`

#### Scenario: Inactive rule is not evaluated
- **WHEN** an input would fail a rule that is NOT in `activeRules`
- **THEN** that rule does not appear in `failureReasons` and does not affect `status`

#### Scenario: Inputs and active rules recorded in result
- **WHEN** `evaluateEligibility` is called with any valid inputs and rule set
- **THEN** result `inputs` equals the supplied inputs and result `activeRules` equals the supplied active rules

### Requirement: MVP default rule set
The system SHALL define `MVP_DEFAULT_RULES` as the ordered list of six enabled checks: `submittedInEnglish`, `alignedWithCall`, `primaryObjectiveIsRd`, `meetsEuropeanDimension`, `requestedBudgetKEur`, `firstTimeApplicantInProgramme`. This list MUST match `openspec/specs/mvp-profile.md §Enabled eligibility checks`.

#### Scenario: Default rules include firstTimeApplicantInProgramme
- **WHEN** `MVP_DEFAULT_RULES` is inspected
- **THEN** it contains `"firstTimeApplicantInProgramme"` as a member

### Requirement: Rule evaluation semantics per check type
The system SHALL evaluate each rule according to its type:
- Boolean rules (`submittedInEnglish`, `alignedWithCall`, `primaryObjectiveIsRd`, `firstTimeApplicantInProgramme`): pass when value is `true`, fail when `false`
- Ternary rule (`meetsEuropeanDimension`): pass when value is `"true"` or `"not_applicable"`, fail when `"false"`
- Budget rule (`requestedBudgetKEur`): pass when value is ≤ 500, fail when > 500

#### Scenario: meetsEuropeanDimension not_applicable is a pass
- **WHEN** `meetsEuropeanDimension` is `"not_applicable"` and the rule is active
- **THEN** `meetsEuropeanDimension` does not appear in `failureReasons`

#### Scenario: firstTimeApplicantInProgramme false is a fail
- **WHEN** `firstTimeApplicantInProgramme` is `false` and the rule is active
- **THEN** result `status` is `"ineligible"` and `failureReasons` contains `"firstTimeApplicantInProgramme"`

#### Scenario: Budget above limit fails
- **WHEN** `requestedBudgetKEur` is 501 and the rule is active
- **THEN** `failureReasons` contains `"requestedBudgetKEur"`

### Requirement: Eligibility check persistence
The system SHALL persist an `EligibilityRecord` when `runEligibilityCheck` is called, recording the evaluated inputs, the resulting status, and the submission it belongs to.

#### Scenario: Record created on check
- **WHEN** `runEligibilityCheck` is called with valid inputs
- **THEN** an `EligibilityRecord` is created with `submissionId`, `status`, and `inputs`

### Requirement: Submission status transition after eligibility check
The system SHALL update the `Submission.status` after running an eligibility check: to `"eligible"` on pass, to `"eligibility_failed"` on fail.

#### Scenario: Status updated to eligible on pass
- **WHEN** all active eligibility rules pass
- **THEN** `Submission.status` is updated to `"eligible"`

#### Scenario: Status updated to eligibility_failed on fail
- **WHEN** one or more active eligibility rules fail
- **THEN** `Submission.status` is updated to `"eligibility_failed"`

### Requirement: Eligibility audit event
The system SHALL produce an `AuditEvent` with `eventType: "eligibility.checked"` for every eligibility check run.

#### Scenario: Audit event generated
- **WHEN** `runEligibilityCheck` completes (pass or fail)
- **THEN** an `AuditEvent` with `eventType: "eligibility.checked"`, `targetType: "Submission"`, and `actorId` equal to the authenticated session's `userId` is created

### Requirement: Active rule derivation
The system SHALL derive `activeRules` from `Call.enabledEligibilityChecks` when a matching `Call` record exists, and SHALL fall back to `MVP_DEFAULT_RULES` when it does not.

#### Scenario: Call rules used when call found
- **WHEN** a `Call` record with `enabledEligibilityChecks` exists for the submission
- **THEN** those checks are used as `activeRules`

#### Scenario: Default rules used when call not found
- **WHEN** no `Call` record matches the submission's `callId`
- **THEN** `MVP_DEFAULT_RULES` (all 6 checks) are used as `activeRules`

## MODIFIED Requirements

### Requirement: firstTimeApplicantInProgramme added to MVP rule set
The `MVP_DEFAULT_RULES` constant and the default `Call.enabledEligibilityChecks` seed value MUST include `"firstTimeApplicantInProgramme"` as the sixth check. Prior to GAP-001 this check was absent.

#### Scenario: Seed call includes all six checks
- **WHEN** the seed script runs and creates the default `Call` record
- **THEN** `Call.enabledEligibilityChecks` contains all six MVP checks including `"firstTimeApplicantInProgramme"`
