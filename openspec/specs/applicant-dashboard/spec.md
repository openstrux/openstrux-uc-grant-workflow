## ADDED Requirements

### Requirement: Applicant dashboard is accessible only to authenticated applicants
The application SHALL render `/dashboard/applicant` only for sessions with role `applicant`. Other authenticated roles accessing this path SHALL receive a 403 or be redirected to their own dashboard.

#### Scenario: Applicant session loads dashboard
- **WHEN** a request with a valid applicant session cookie reaches `/dashboard/applicant`
- **THEN** the page renders the applicant's proposal data

#### Scenario: Admin accessing applicant dashboard is redirected
- **WHEN** a request with role `admin` reaches `/dashboard/applicant`
- **THEN** the response redirects to `/dashboard/admin`

---

### Requirement: Applicant dashboard fetches and shows current proposal status
The application SHALL load the applicant's proposal by reading `session.submissionId` and calling `getSubmission(session.submissionId)`. The page MUST NOT hardcode `proposal = null`. It SHALL display a status card with the proposal title, current `ProposalStatus` rendered as a `StatusBadge`, and submitted date. If `session.submissionId` is absent or `getSubmission` returns `null`, an appropriate empty state is shown with a link to `/submit`.

**Critical constraint:** The proposal data MUST be fetched dynamically from the database using `session.submissionId`. Any implementation that hardcodes `null` or skips the database call violates this requirement and will cause submitted proposals to be invisible to applicants.

#### Scenario: Proposal status card renders for existing proposal
- **WHEN** the applicant session contains a `submissionId` and `getSubmission(submissionId)` returns a record
- **THEN** the title, StatusBadge, and submitted date are visible

#### Scenario: Empty state is shown when no proposal exists
- **WHEN** the applicant session has no `submissionId`, or `getSubmission` returns `null`
- **THEN** a prompt with a link to `/submit` is displayed and `getSubmission` is either not called or returns null

---

### Requirement: Applicant dashboard shows a status progress timeline
The application SHALL display a visual step-progress timeline showing the proposal's journey from `submitted` through `eligible`, `under_review`, to `selected` or `rejected`. The current status SHALL be highlighted; completed steps SHALL be visually distinguished from pending steps.

#### Scenario: Current step is highlighted
- **WHEN** the proposal is in status `under_review`
- **THEN** the "Under Review" step is visually active and prior steps appear as completed

---

### Requirement: Applicant dashboard shows feedback when available
The application SHALL display a feedback section populated with reviewer or admin notes when the proposal status is `clarification_requested` or `revised`. The section SHALL be hidden when no feedback is present.

#### Scenario: Feedback section is visible for clarification_requested status
- **WHEN** the proposal status is `clarification_requested` and feedback data is present
- **THEN** the feedback section renders the note text

#### Scenario: Feedback section is hidden when no feedback exists
- **WHEN** the proposal has no feedback notes
- **THEN** the feedback section is not rendered
