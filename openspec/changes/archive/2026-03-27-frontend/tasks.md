## 1. Dependencies and Environment

- [x] 1.1 Install `jose`, `tailwindcss`, `@tailwindcss/forms` as dependencies; move `bcrypt` from devDeps to deps in `package.json`
- [x] 1.2 Create `tailwind.config.ts` and `postcss.config.mjs`; add Tailwind directives to `globals.css` via `@import "tailwindcss"` and map existing CSS custom properties into `@theme`
- [x] 1.3 Rename `NEXTAUTH_SECRET` → `SESSION_SECRET` in `.env.example`; update any references in `src/` (grep for NEXTAUTH_SECRET)

## 2. Session Auth Library

- [x] 2.1 Create `src/lib/session.ts` with `encrypt(payload)`, `decrypt(cookie)`, `createSession(userId, role)`, `deleteSession()`, and `getSession()` — using `jose` HS256 and `SESSION_SECRET`
- [x] 2.2 Update `src/lib/dal.ts` `verifySession()` to call `getSession()` and return the `Principal` from the JWT instead of reading `X-Role`/`X-User-Id` headers

## 3. Next.js 16 Proxy

- [x] 3.1 Create `src/proxy.ts` exporting `async function proxy(req: NextRequest)` with matcher `/((?!api|_next/static|_next/image|.*\\.png$).*)`; protect `/dashboard/*` (redirect unauthenticated → `/login`); redirect authenticated users on `/login` to their role dashboard

## 4. Auth API Routes

- [x] 4.1 Create `src/app/api/auth/login/route.ts` — validate email+password against hardcoded dev users (annotated `@dev-only`); call `createSession()`; return 200 with `{ userId, role }` or 401
- [x] 4.2 Create `src/app/api/auth/logout/route.ts` — call `deleteSession()`; redirect to `/`
- [x] 4.3 Create `src/app/api/auth/register/route.ts` — validate `RegisterRequest` schema; check for duplicate email stub; call `createSession()` for new applicant; return 201 with `{ userId, submissionId }` or 409/400
- [x] 4.4 Add `LoginRequest` and `RegisterRequest` Zod schemas to `src/domain/schemas/index.ts`

## 5. Update Existing Stubs for Session Auth

- [x] 5.1 Update `src/app/api/intake/route.ts` — replace `X-Role`/`X-User-Id` header reads with `getSession()` call; maintain same auth requirements (applicant or admin)
- [x] 5.2 Update `src/app/api/eligibility/route.ts` — same: replace header reads with `getSession()`

## 6. Shared Component Library — UI Primitives

- [x] 6.1 Create `src/components/ui/Button.tsx` — variants: primary/secondary/ghost/danger; sizes: sm/md/lg; `isLoading` prop with Spinner
- [x] 6.2 Create `src/components/ui/Badge.tsx` — variant prop mapped from ProposalStatus and semantic states
- [x] 6.3 Create `src/components/ui/Card.tsx` — surface container with optional `header` and `footer` render slots
- [x] 6.4 Create `src/components/ui/DataTable.tsx` — generic typed table; `columns`, `rows`, `emptyState` props; row action callback
- [x] 6.5 Create `src/components/ui/Modal.tsx` — HeadlessUI `Dialog` + `Transition`; `open`, `onClose`, `title`, `children` props
- [x] 6.6 Create `src/components/ui/Select.tsx` — HeadlessUI `Listbox` wrapper; `value`, `onChange`, `options: {value,label}[]` props
- [x] 6.7 Create `src/components/ui/FormField.tsx` — composes label + input/textarea/select + hint + error; `as` prop for element type
- [x] 6.8 Create `src/components/ui/Spinner.tsx` — animated SVG spinner; sizes: sm/md/lg

## 7. Shared Component Library — Layout

- [x] 7.1 Create `src/components/layout/AppShell.tsx` — sidebar (role-aware nav links + logout button) + topbar (page title + user chip) + main content area
- [x] 7.2 Create `src/components/layout/PublicNav.tsx` — public site navigation with site name/logo and contextual links (Submit / Login)
- [x] 7.3 Create `src/components/layout/DashboardHeader.tsx` — title + subtitle + optional intro paragraph
- [x] 7.4 Create `src/components/layout/SectionSeparator.tsx` — gradient horizontal rule with optional centred label

## 8. Shared Component Library — Proposal Domain

- [x] 8.1 Create `src/components/proposal/StatusBadge.tsx` — maps `ProposalStatus` to `Badge` with correct colour; `under_review` renders pulse dot
- [x] 8.2 Create `src/components/proposal/ProposalTable.tsx` — wraps `DataTable`; role-aware column set (admin: full columns including alias; reviewer/validator: blinded columns only)

## 9. Root Layout Update

- [x] 9.1 Update `src/app/layout.tsx` — render `PublicNav` for public routes; render `AppShell` for authenticated routes; use `getSession()` to determine which shell to show

## 10. Login Page

- [x] 10.1 Create `src/app/login/page.tsx` — email + password form; POST to `/api/auth/login`; on success redirect to role dashboard; link to `/submit`; show inline error on 401

## 11. Landing Page Redesign

- [x] 11.1 Rewrite `src/app/page.tsx` — Section 1: hero with mesh-gradient background, headline, tagline, EU badge, "Submit your proposal" CTA, "Reviewer / Admin login" ghost link
- [x] 11.2 Add features section (3 cards: open calls, blinded review, fair process) and 4-step process timeline to Section 1
- [x] 11.3 Add privacy statement accordion (collapsed by default, HeadlessUI `Disclosure`) to Section 1
- [x] 11.4 Add `SectionSeparator` with "About this demo" label between sections
- [x] 11.5 Add Section 2: Openstrux manifesto explanation paragraph, 3–4 manifesto point cards, "View benchmark results" button linking to `/benchmarks`
- [x] 11.6 Add CSS entrance animation keyframes to `globals.css` (`@keyframes fadeInUp`); apply to hero and section elements

## 12. Submit Page Redesign

- [x] 12.1 Rewrite `src/app/submit/page.tsx` — three-section form: Contact information (first name, last name, email, organisation, country, website)
- [x] 12.2 Add Project information section to submit form: call select, title, abstract, budget kEUR, budget usage, tasks breakdown
- [x] 12.3 Add Account creation section to submit form: password, confirm password, privacy policy checkbox; client-side validation (password match, 8-char min)
- [x] 12.4 Wire submit form to `POST /api/auth/register`; show loading state on button; handle 201 (redirect to `/dashboard/applicant`), 409 (inline email error), and other errors

## 13. Dashboard Pages

- [x] 13.1 Create `src/app/dashboard/applicant/page.tsx` — status card (title, StatusBadge, submitted date), step-progress timeline, conditional feedback panel; empty state with link to `/submit`
- [x] 13.2 Create `src/app/dashboard/admin/page.tsx` — stats row (4 counters), `ProposalTable` with full columns, assign-reviewer Modal wired to `POST /api/proposals/[id]/assign`
- [x] 13.3 Create `src/app/dashboard/reviewer/page.tsx` — blinded `ProposalTable` (no identity columns), inline review form (notes textarea + recommendation select) wired to `POST /api/proposals/[id]/review`
- [x] 13.4 Create `src/app/dashboard/validator/page.tsx` — blinded `ProposalTable` with reviewer-recommendation column, validation form (decision select + notes) wired to `POST /api/proposals/[id]/validate`
- [x] 13.5 Create `src/app/dashboard/auditor/page.tsx` — audit events `DataTable` (timestamp, event type, actor role, target type, target ID, payload summary), client-side filter bar (event type + date range)

## 14. New Stub API Routes

- [x] 14.1 Create `src/app/api/proposals/route.ts` — `GET`: auth check (admin/reviewer/validator/auditor), return `[]`; typed `SubmissionSummary[]` response shape
- [x] 14.2 Create `src/app/api/proposals/[id]/route.ts` — `GET`: auth check, return `null`; typed `SubmissionDetail | null` response
- [x] 14.3 Create `src/app/api/proposals/[id]/assign/route.ts` — `POST`: admin-only auth check; validate `{ reviewerId: string }` body; return 501 stub with correct shape
- [x] 14.4 Create `src/app/api/proposals/[id]/review/route.ts` — `POST`: reviewer-only auth check; validate `{ notes: string, recommendation: 'shortlist'|'reject'|'request_clarification' }`; return 501 stub
- [x] 14.5 Create `src/app/api/proposals/[id]/validate/route.ts` — `POST`: validator-only auth check; validate `{ decision: 'approve'|'reject', notes: string }`; return 501 stub
- [x] 14.6 Create `src/app/api/audit/route.ts` — `GET`: auditor-only auth check; return `[]`; typed `AuditEvent[]` response shape

## 15. Benchmark Results (Fully Implemented)

- [x] 15.1 Create `src/app/api/benchmarks/route.ts` — reads `../openstrux/benchmarks/results/` via `fs.readdir`; parses `generation-meta.json` + `test-unit.json` per subdirectory; skips malformed dirs; returns `BenchmarkResult[]` sorted by date desc; returns `[]` if dir absent
- [x] 15.2 Create `src/app/benchmarks/page.tsx` — fetches `/api/benchmarks`; renders path-comparison summary cards (averages per path); renders results `DataTable` (date, path, tokens, turns, pass rate); empty state when no results

## 16. Verification

- [x] 16.1 Run `pnpm test:unit` — fix any regressions caused by auth header→session changes
- [x] 16.2 Smoke test: load `/` (both sections visible), navigate to `/submit` (form renders), complete submit flow (stub register → redirect to `/dashboard/applicant`)
- [x] 16.3 Smoke test: login as each of the 5 dev users and verify correct dashboard loads
- [x] 16.4 Smoke test: verify proxy blocks `/dashboard/admin` without session → redirects to `/login`
- [x] 16.5 Smoke test: load `/benchmarks` — empty state renders without error
