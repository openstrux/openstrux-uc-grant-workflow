## ADDED Requirements

### Requirement: Validator dashboard is accessible only to authenticated validators
The application SHALL render `/dashboard/validator` only for sessions with role `validator`.

#### Scenario: Validator session loads validation queue
- **WHEN** a request with role `validator` reaches `/dashboard/validator`
- **THEN** the list of proposals in `validation_pending` status is rendered

---

### Requirement: Validator dashboard lists proposals pending validation
The application SHALL display a `ProposalTable` (blinded columns) showing proposals with status `validation_pending`. Columns SHALL include: blinded title, budget (kEUR), reviewer recommendation, status, and actions. Identity data SHALL NOT appear.

#### Scenario: Reviewer recommendation column is visible
- **WHEN** the validator table renders a row for a shortlisted proposal
- **THEN** the reviewer's recommendation (shortlist/reject/clarify) is displayed

---

### Requirement: Validator can submit a validation decision
The application SHALL provide a validation form with: a `textarea` for validation notes, a decision `Select` (options: `approve`, `reject`), and a submit button. Submission calls `POST /api/proposals/[id]/validate`.

#### Scenario: Validation form renders for validation_pending proposals
- **WHEN** the validator clicks "Validate" on a `validation_pending` proposal
- **THEN** the validation form is shown

#### Scenario: Validation submission calls the stub API
- **WHEN** the validator selects a decision and submits
- **THEN** `POST /api/proposals/[id]/validate` is called with `{ decision, notes }`
