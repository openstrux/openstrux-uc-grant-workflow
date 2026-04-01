## ADDED Requirements

### Requirement: Session is created on successful login
The application SHALL accept email and password via `POST /api/auth/login`, validate credentials, and set an httpOnly `session` cookie containing a signed JWT with `userId`, `role`, and `expiresAt`. The JWT SHALL be signed with the `SESSION_SECRET` environment variable using HS256. Session lifetime SHALL be 7 days.

#### Scenario: Valid credentials return session cookie
- **WHEN** a POST request is made to `/api/auth/login` with a valid email and password
- **THEN** the response is 200, a `Set-Cookie: session=<jwt>; HttpOnly; Secure; SameSite=lax` header is set, and the body contains `{ userId, role }`

#### Scenario: Invalid credentials return 401
- **WHEN** a POST request is made to `/api/auth/login` with an incorrect password or unknown email
- **THEN** the response is 401 with body `{ error: "Invalid credentials" }` and no cookie is set

#### Scenario: Missing fields return 400
- **WHEN** a POST request is made to `/api/auth/login` with missing email or password
- **THEN** the response is 400 with a validation error body

---

### Requirement: Session is destroyed on logout
The application SHALL clear the `session` cookie when `POST /api/auth/logout` is called.

#### Scenario: Logout clears session cookie and redirects
- **WHEN** a POST request is made to `/api/auth/logout`
- **THEN** the `session` cookie is deleted (Max-Age=0) and the response redirects to `/`

---

### Requirement: Account and submission are created on registration
The application SHALL accept contact info, project info, and a password via `POST /api/auth/register`, persist the proposal by calling `submitProposal()`, and set a session cookie for the new applicant that includes the resulting `submissionId`. The session cookie MUST contain `{ userId, role, submissionId }` so that server components can retrieve the applicant's proposal without an additional lookup.

**Critical constraint:** `submitProposal()` MUST be called before the session is created. The `submissionId` returned by `submitProposal()` MUST be stored in the session JWT as the third argument to `createSession(userId, role, submissionId)`. Omitting this prevents the applicant dashboard from displaying the proposal.

#### Scenario: Valid registration persists proposal and creates session
- **WHEN** a POST request is made to `/api/auth/register` with all required fields
- **THEN** `submitProposal()` is called with the proposal fields from the request body, the response is 201, a session cookie is set for the new applicant with `submissionId` embedded, and the body contains `{ userId, submissionId }`

#### Scenario: Session JWT contains submissionId after registration
- **WHEN** registration succeeds and a session cookie is issued
- **THEN** decoding the JWT reveals `{ userId, role: "applicant", submissionId: "<id>" }` where `submissionId` matches the value in the 201 response body

#### Scenario: submitProposal is NOT called when validation fails
- **WHEN** the request body is invalid (missing required fields, bad email, short password, etc.)
- **THEN** `submitProposal()` is not called and the response is 400

#### Scenario: submitProposal is NOT called for duplicate email
- **WHEN** the email is already registered
- **THEN** `submitProposal()` is not called and the response is 409 with body `{ error: "Email already registered" }`

---

### Requirement: Proxy protects authenticated routes
The application SHALL use `src/proxy.ts` to enforce authentication on all `/dashboard/*` routes. Unauthenticated requests SHALL be redirected to `/login`. Authenticated requests on `/login` SHALL be redirected to the appropriate role dashboard.

#### Scenario: Unauthenticated access to dashboard redirects to login
- **WHEN** a request without a valid `session` cookie is made to any `/dashboard/*` path
- **THEN** the response is a redirect to `/login`

#### Scenario: Authenticated user on login page is redirected to role dashboard
- **WHEN** a request with a valid session cookie (role=admin) is made to `/login`
- **THEN** the response redirects to `/dashboard/admin`

#### Scenario: Public routes are accessible without session
- **WHEN** a request without a session cookie is made to `/`, `/submit`, or `/login`
- **THEN** the response proceeds normally (no redirect)

---

### Requirement: Session is readable in server components and API routes
The application SHALL expose a `getSession()` helper that reads and decrypts the `session` cookie from the current request context and returns `{ userId, role, submissionId? } | null`. The `submissionId` field is present for `applicant` sessions and absent for all other roles.

#### Scenario: Valid session cookie returns principal with submissionId for applicants
- **WHEN** `getSession()` is called in a server context with a valid applicant session cookie
- **THEN** it returns `{ userId: string, role: "applicant", submissionId: string }`

#### Scenario: Valid session cookie returns principal without submissionId for staff
- **WHEN** `getSession()` is called with a valid session cookie for a non-applicant role
- **THEN** it returns `{ userId: string, role: Role }` with no `submissionId` field

#### Scenario: Missing or expired cookie returns null
- **WHEN** `getSession()` is called with no cookie or an expired JWT
- **THEN** it returns `null`
