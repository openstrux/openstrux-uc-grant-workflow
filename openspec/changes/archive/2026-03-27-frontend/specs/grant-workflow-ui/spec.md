## MODIFIED Requirements

### Requirement: Home page is a full EU grant portal with a benchmark demo section
The application SHALL display a landing page at `/` with two visually distinct sections. Section 1 SHALL present a privacy-first EU open-source grant portal (hero, features, process, privacy). Section 2, separated by a visible section divider, SHALL present the Openstrux benchmark demo context.

#### Scenario: Landing page renders both sections
- **WHEN** a user navigates to `/`
- **THEN** the page renders the EU grant portal section and the Openstrux benchmark demo section, separated by a visual divider

#### Scenario: Primary CTA links to submit page
- **WHEN** a user clicks the primary call-to-action on the landing page
- **THEN** they are navigated to `/submit`

---

### Requirement: Proposal intake form captures full contact and project information with account creation
The application SHALL provide a form at `/submit` that collects: First name, Last name, Email, Organisation, Country (select), Website (optional), Call (select), Project title, Abstract, Budget kEUR (1–500), Budget usage, Tasks breakdown, Password, Confirm password, and a privacy policy acceptance checkbox. The form SHALL be accessible without authentication.

#### Scenario: Successful submission creates account and redirects to applicant dashboard
- **WHEN** a user submits the form with all required fields and matching passwords
- **THEN** the form POSTs to `/api/auth/register` and redirects to `/dashboard/applicant` on 201 response

#### Scenario: Submission error is displayed inline
- **WHEN** the `/api/auth/register` call returns an error
- **THEN** the error message is displayed in the form without navigation

---

## REMOVED Requirements

### Requirement: Home page provides navigation entry points
**Reason**: Superseded by the full landing page redesign. The simple "links to /submit and /admin" requirement is replaced by the new multi-section landing page with role-aware navigation.
**Migration**: The `/submit` link is now the primary CTA in the hero. The `/admin` link is replaced by a `/login` link for reviewers and admins.

### Requirement: Admin dashboard lists all submissions
**Reason**: Replaced by `/dashboard/admin` (role-gated, full UI). The old `/admin` route is retained only for proposal detail and eligibility sub-routes.
**Migration**: Admin users accessing `/admin` are redirected to `/dashboard/admin`. The proposal detail and eligibility pages at `/admin/proposals/[id]` and `/admin/proposals/[id]/eligibility` remain.
