# Domain Model

Version: 0.1.0 | Covers: P0-P2 (v0.6.0)

## Core entities

### User
A system actor with a role. Used for dev-mode authentication and seeding; not an external IdP record.
- `id` (matches `X-User-Id` header), `display_name`, `role` (Principal), `password_hash` (bcrypt, dev only)

### Call
A funding call with configuration for eligibility checks and submission window.
- `id`, `title`, `description`, `open_date`, `close_date`, `status`
- Config: `enabled_eligibility_checks[]`, `max_budget_k_eur`, `reviewer_policy_version`

### Submission
A proposal dossier linking an applicant to a call.
- `id`, `call_id`, `applicant_alias`, `status` (ProposalStatus), `submitted_at`

### ProposalVersion
A versioned snapshot of proposal content (separable from identity).
- `id`, `submission_id`, `version_number`, `is_effective`
- Content: `title`, `abstract`, `requested_budget_k_eur`, `budget_usage`, `tasks_breakdown`, `attachments_meta`

### ApplicantIdentity
Identity and contact data — stored separately from proposal content.
- `id`, `submission_id`, `legal_name`, `email`, `country`, `organisation`

### BlindedPacket
Reviewer-facing view of a proposal — identity stripped.
- `id`, `proposal_version_id`, `content` (JSON blob, identity-free)

### EligibilityRecord
Result of eligibility gate evaluation.
- `id`, `submission_id`, `status` (eligible | ineligible | pending)
- `inputs` (EligibilityInputs), `active_rules[]`, `failure_reasons[]`, `evaluated_at`

### EligibilityInputs
- `submitted_in_english: boolean`
- `aligned_with_call: boolean`
- `primary_objective_is_rd: boolean`
- `meets_european_dimension: "true" | "false" | "not_applicable"`
- `requested_budget_k_eur: number`
- `first_time_applicant_in_programme: boolean`

### AuditEvent
Immutable log entry for workflow, access, and policy decisions.
- `id`, `event_type`, `actor_id`, `target_type`, `target_id`, `payload` (JSON), `timestamp`

## Enumerations

### ProposalStatus
`draft | submitted | eligibility_failed | eligible | under_review | clarification_requested | revised | validation_pending | selected | rejected`

### ReviewStatus (P3+)
`not_started | assigned | acknowledged | reviewing | completed | withdrawn`

### Principal (role enum)
`applicant | admin | reviewer | validator | auditor`

## Relationships

```
User (role)
Call ──< Submission ──< ProposalVersion ──> BlindedPacket
              │
              ├──> ApplicantIdentity (separated, restricted access)
              └──> EligibilityRecord
```
