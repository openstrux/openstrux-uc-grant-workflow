# Workflow State Machine

## Purpose

Defines the rules governing valid submission status transitions throughout the grant workflow lifecycle.

## Requirements

### Requirement: Valid transition enforcement
The system SHALL export `isValidTransition(from, to)` returning `true` only for transitions permitted by `openspec/specs/workflow-states.md`. All other transitions MUST return `false`.

Permitted transitions:
- `draft` → `submitted`
- `submitted` → `eligible`
- `submitted` → `eligibility_failed`
- `eligible` → `under_review`

#### Scenario: draft to submitted allowed
- **WHEN** `isValidTransition("draft", "submitted")` is called
- **THEN** it returns `true`

#### Scenario: submitted to eligible allowed
- **WHEN** `isValidTransition("submitted", "eligible")` is called
- **THEN** it returns `true`

#### Scenario: submitted to eligibility_failed allowed
- **WHEN** `isValidTransition("submitted", "eligibility_failed")` is called
- **THEN** it returns `true`

#### Scenario: eligible to under_review allowed
- **WHEN** `isValidTransition("eligible", "under_review")` is called
- **THEN** it returns `true`

#### Scenario: eligibility_failed to under_review rejected
- **WHEN** `isValidTransition("eligibility_failed", "under_review")` is called
- **THEN** it returns `false` (FR-P2-007: ineligible submissions cannot be reviewed)

#### Scenario: Skipping submitted state rejected
- **WHEN** `isValidTransition("draft", "eligible")` is called
- **THEN** it returns `false` (submissions must pass through `submitted`)

#### Scenario: Backwards transitions rejected
- **WHEN** `isValidTransition("under_review", "draft")` is called
- **THEN** it returns `false` (no backwards transitions permitted)

### Requirement: Event-driven next status derivation
The system SHALL export `getNextStatus(currentStatus, event)` returning the resulting status for a given state + event pair, per the workflow state machine.

#### Scenario: eligibility_pass event from submitted returns eligible
- **WHEN** `getNextStatus("submitted", "eligibility_pass")` is called
- **THEN** it returns `"eligible"`

#### Scenario: eligibility_fail event from submitted returns eligibility_failed
- **WHEN** `getNextStatus("submitted", "eligibility_fail")` is called
- **THEN** it returns `"eligibility_failed"`
