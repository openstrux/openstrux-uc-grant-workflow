## ADDED Requirements

### Requirement: Submit page is accessible without authentication
The application SHALL render `/submit` without requiring a session cookie. No authentication check or redirect SHALL occur for this route.

#### Scenario: Unauthenticated user can load the submit page
- **WHEN** a visitor without a session navigates to `/submit`
- **THEN** the page renders the submission form without redirect

---

### Requirement: Submit form collects contact information
The application SHALL display a "Contact information" section with the following fields: First name (required), Last name (required), Email (required, becomes account username), Organisation (required), Country (required, rendered as a select), Website (optional).

#### Scenario: Required contact fields are validated before submission
- **WHEN** the form is submitted with a missing required contact field
- **THEN** an inline validation error is displayed for each missing field and the form is not submitted

---

### Requirement: Submit form collects project information
The application SHALL display a "Project information" section with the following fields: Call (required, select), Project title (required), Abstract (required, textarea), Requested budget in kEUR (required, number 1–500), Budget usage breakdown (required, textarea), Tasks breakdown (required, textarea).

#### Scenario: Budget is constrained to 1–500 kEUR
- **WHEN** the user enters a budget outside the 1–500 range
- **THEN** an inline validation error is displayed

---

### Requirement: Submit form creates an account
The application SHALL display an "Account creation" section at the bottom of the form with fields: Password (required, minimum 8 characters), Confirm password (required, must match), and a privacy policy acceptance checkbox (required).

#### Scenario: Mismatched passwords show inline error
- **WHEN** password and confirm-password fields do not match
- **THEN** an inline error is displayed on the confirm-password field

#### Scenario: Unchecked privacy policy prevents submission
- **WHEN** the privacy policy checkbox is unchecked and the form is submitted
- **THEN** submission is blocked and an error is shown on the checkbox

---

### Requirement: Successful submission creates user and redirects to applicant dashboard
The application SHALL POST all form data to `POST /api/auth/register`. On 201 response the user SHALL be redirected to `/dashboard/applicant`. On error the form SHALL display the server error inline without navigation.

#### Scenario: Successful registration redirects to applicant dashboard
- **WHEN** all fields are valid and `POST /api/auth/register` returns 201
- **THEN** the user is redirected to `/dashboard/applicant` and a success notification is visible

#### Scenario: Duplicate email error is shown inline
- **WHEN** `POST /api/auth/register` returns 409
- **THEN** an error message "Email already registered" is shown near the email field

#### Scenario: Submit button shows loading state during request
- **WHEN** the form is submitted and the request is in-flight
- **THEN** the submit button is disabled and shows a spinner
