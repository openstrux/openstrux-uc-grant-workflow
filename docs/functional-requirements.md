# Functional Requirements

This is a summary of functional requirements per phase. The authoritative source is `openstrux/docs/use-cases/grant-workflow/UseCaseRequirements.md`.

## P0 — Canonical model

- FR-P0-001: Typed canonical model for identity, proposal, workflow, roles, policies, audit
- FR-P0-002: Identity/legal/contact data separated from evaluable proposal content at data-model level
- FR-P0-003: Workflow states: draft, submitted, eligibility_failed, eligible, under_review, clarification_requested, revised, validation_pending, selected, rejected
- FR-P0-004: Role-bound visibility rules — reviewers cannot access identity fields by default
- FR-P0-005: All policy checks as explicit machine-readable rules

## P1 — Intake and data separation

- FR-P1-001: Proposal dossier creation through lightweight predefined UI
- FR-P1-002: Proposal data and applicant identity in separate storage structures
- FR-P1-003: Pseudonymous submission before award-related identity verification
- FR-P1-004: Multiple proposal versions per submission
- FR-P1-005: One proposal version marked as effective review version
- FR-P1-006: Submission metadata: call, timestamp, alias, budget, title, abstract, budget usage, tasks breakdown, attachments
- FR-P1-007: Blinded review packet generated automatically from effective version
- FR-P1-008: Blinded packet excludes identity and business-identifying fields
- FR-P1-009: Traceability between blinded packet and original submission without exposing link to reviewers

## P2 — Eligibility gate

- FR-P2-001: First-stage eligibility criteria as explicit boolean/enumerated/numeric inputs only
- FR-P2-002: No semantic reading of free-text for eligibility
- FR-P2-003: Minimum inputs: submitted_in_english, aligned_with_call, primary_objective_is_rd, meets_european_dimension, requested_budget_k_eur, first_time_applicant_in_programme
- FR-P2-004: Call-specific activation/deactivation of individual checks
- FR-P2-005: Eligibility computed using explicit rule logic over active checks
- FR-P2-006: Machine-readable failure reasons for each failed hard criterion
- FR-P2-007: Reviewer assignment blocked when eligibility status is ineligible
- FR-P2-008: Record exact input values and active rule set used

## P3–P6

Deferred to future phases. See `docs/scope.md`.
