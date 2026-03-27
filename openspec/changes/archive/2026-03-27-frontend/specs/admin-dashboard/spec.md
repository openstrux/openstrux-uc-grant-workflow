## ADDED Requirements

### Requirement: Admin dashboard is accessible only to authenticated admins
The application SHALL render `/dashboard/admin` only for sessions with role `admin`.

#### Scenario: Admin session loads the admin dashboard
- **WHEN** a request with role `admin` reaches `/dashboard/admin`
- **THEN** the proposals list and stats row are rendered

---

### Requirement: Admin dashboard shows a stats row
The application SHALL display a row of summary counters showing: total proposals, submitted (awaiting eligibility), eligible, and under_review counts. Counts are derived from the proposals returned by `GET /api/proposals`.

#### Scenario: Stats row renders four counters
- **WHEN** the admin dashboard loads with proposal data
- **THEN** four labelled counters are visible at the top of the page

---

### Requirement: Admin dashboard lists all proposals in a table
The application SHALL display a `ProposalTable` with columns: applicant alias, proposal title, `StatusBadge`, submitted date, assigned reviewer (if any), and an actions column.

#### Scenario: Each row shows available actions based on proposal status
- **WHEN** a proposal has status `submitted`
- **THEN** the actions column shows "Run eligibility" linking to `/admin/proposals/<id>/eligibility`

#### Scenario: Eligible proposal shows assign-reviewer action
- **WHEN** a proposal has status `eligible`
- **THEN** the actions column shows an "Assign reviewer" button

---

### Requirement: Admin can assign a reviewer via a modal
The application SHALL present an "Assign reviewer" Modal when the admin clicks the assign button on an eligible proposal. The modal SHALL contain a `Select` of available reviewers (from `GET /api/proposals/[id]/assign` options) and a confirm button that calls `POST /api/proposals/[id]/assign`.

#### Scenario: Assign reviewer modal opens on button click
- **WHEN** the admin clicks "Assign reviewer" on an eligible proposal row
- **THEN** the assign-reviewer Modal opens with a reviewer selector

#### Scenario: Successful assignment closes modal and refreshes table
- **WHEN** the admin selects a reviewer and confirms
- **THEN** `POST /api/proposals/[id]/assign` is called, the modal closes, and the table reflects the updated assignment
