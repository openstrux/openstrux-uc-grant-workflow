### Requirement: Home page provides navigation entry points
The application SHALL display a home page at `/` with links to submit a new proposal and access the admin dashboard.

#### Scenario: User visits home page
- **WHEN** a user navigates to `/`
- **THEN** the page displays links to `/submit` and `/admin`

---

### Requirement: Proposal intake form captures all required fields
The application SHALL provide a form at `/submit` that collects: funding call selection, applicant alias (pseudonym), title, abstract, requested budget in kEUR, budget usage explanation, and tasks breakdown.

#### Scenario: Successful submission redirects to proposal detail
- **WHEN** a user submits the form with all required fields
- **THEN** the form POSTs to `/api/intake` and redirects to `/admin/proposals/<submissionId>` on success

#### Scenario: Submission error is displayed inline
- **WHEN** the `/api/intake` call returns an error
- **THEN** the error message is displayed in the form without navigation

#### Scenario: Applicant alias is presented as pseudonymous field
- **WHEN** the form is rendered
- **THEN** the alias field SHALL be labelled as a pseudonym and include a hint that it is not shared with reviewers

---

### Requirement: Admin dashboard lists all submissions
The application SHALL provide a server-rendered page at `/admin` that lists all submissions with their ID (truncated), applicant alias, status badge, submission date, and action links.

#### Scenario: Empty state is shown when no submissions exist
- **WHEN** the submission list is empty
- **THEN** the page displays an empty-state message

#### Scenario: Submission row links to detail and eligibility pages
- **WHEN** submissions are present
- **THEN** each row SHALL include a link to `/admin/proposals/<id>` and `/admin/proposals/<id>/eligibility`

---

### Requirement: Proposal detail page shows content and actions
The application SHALL provide a server-rendered page at `/admin/proposals/[id]` showing the effective proposal version (title, abstract, budget, budget usage, tasks breakdown), current status, and a link to run the eligibility check.

#### Scenario: Missing submission returns 404
- **WHEN** the submission ID does not exist
- **THEN** the page calls `notFound()` and renders the 404 response

#### Scenario: Proposal with no version shows placeholder
- **WHEN** the submission exists but has no effective version
- **THEN** the title area displays a placeholder (e.g. "(no version)")

---

### Requirement: Eligibility check form collects explicit boolean and numeric inputs
The application SHALL provide a client-rendered form at `/admin/proposals/[id]/eligibility` that collects: submitted-in-English, aligned-with-call, primary-objective-is-RD, meets-European-dimension, requested budget (kEUR), and first-time-applicant flags. No semantic analysis of proposal content is performed by the UI.

#### Scenario: Successful check redirects to proposal detail
- **WHEN** the form is submitted with valid inputs
- **THEN** the form POSTs to `/api/eligibility` and redirects to `/admin/proposals/<id>` on success

#### Scenario: Eligibility check error is displayed inline
- **WHEN** the `/api/eligibility` call returns an error
- **THEN** the error message is displayed in the form without navigation

---

### Requirement: All pages call service layer exclusively
No page or route handler SHALL directly query the database, call external APIs, or access the filesystem. All data access MUST go through functions exported from `src/server/services/`.

#### Scenario: Server component data access
- **WHEN** a server component needs submission data
- **THEN** it imports and calls a function from `src/server/services/submissionService`

#### Scenario: Route handler data access
- **WHEN** an API route handler processes a request
- **THEN** it imports and calls a function from the appropriate service module in `src/server/services/`
