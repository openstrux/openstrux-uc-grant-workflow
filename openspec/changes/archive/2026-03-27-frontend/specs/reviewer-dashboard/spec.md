## ADDED Requirements

### Requirement: Reviewer dashboard is accessible only to authenticated reviewers
The application SHALL render `/dashboard/reviewer` only for sessions with role `reviewer`.

#### Scenario: Reviewer session loads assigned proposals
- **WHEN** a request with role `reviewer` reaches `/dashboard/reviewer`
- **THEN** the blinded proposal list is rendered

---

### Requirement: Reviewer dashboard lists only assigned blinded proposals
The application SHALL display a `ProposalTable` (blinded columns only — no identity data) showing proposals assigned to the current reviewer. The alias and identity fields SHALL NOT appear. Columns SHALL include: blinded title, budget (kEUR), status, and actions.

#### Scenario: Identity columns are absent from the reviewer table
- **WHEN** the reviewer dashboard renders the proposal table
- **THEN** no column contains applicant name, email, organisation, or legal identity data

---

### Requirement: Reviewer can submit a review for an assigned proposal
The application SHALL provide a review form (inline or on a sub-route) with: a `textarea` for review notes, a recommendation `Select` (options: `shortlist`, `reject`, `request_clarification`), and a submit button. Submission calls `POST /api/proposals/[id]/review`.

#### Scenario: Review form renders for under_review proposals
- **WHEN** the reviewer clicks "Write review" on an `under_review` proposal
- **THEN** the review form is shown (inline expand or navigate to sub-page)

#### Scenario: Review submission calls the stub API
- **WHEN** the reviewer fills in notes and recommendation and submits
- **THEN** `POST /api/proposals/[id]/review` is called with `{ notes, recommendation }`

#### Scenario: Completed review shows a submitted indicator
- **WHEN** the reviewer has already submitted a review for a proposal
- **THEN** the row indicates "Review submitted" and the form is not shown
