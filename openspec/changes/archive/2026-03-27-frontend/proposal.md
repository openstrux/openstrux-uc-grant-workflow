## Why

The grant workflow application needs a production-quality pre-built frontend that defines the service interfaces both generation paths must satisfy. Pre-building ensures benchmark fairness: both direct and Openstrux paths start from the same baseline and differ only in backend implementation. The initial scaffold (5 minimal pages, no auth, inline CSS) was insufficient for a credible benchmark demonstrating the system in realistic use.

## What Changes

- **New: session auth layer** — custom `jose` JWT session with httpOnly cookie; `src/proxy.ts` protecting `/dashboard/*`; login/register/logout API routes with dev-user stubs; `src/lib/session.ts` helpers; `src/lib/dal.ts` reads session cookie (replaces `X-Role`/`X-User-Id` headers)
- **New: Tailwind CSS v4** installed alongside existing CSS custom properties; all new components use Tailwind utility classes
- **New: shared component library** — `src/components/ui/` (Button, Badge, Card, DataTable, Modal, Select, FormField, Spinner), `src/components/layout/` (AppShell, PublicNav, DashboardHeader, SectionSeparator), `src/components/proposal/` (ProposalTable, StatusBadge)
- **New: landing page redesign** — EU grant portal hero, feature cards, process timeline, privacy accordion, CTAs; Openstrux benchmark demo section linking to `/benchmarks`
- **New: submit page redesign** — NLnet-inspired multi-section form (contact info, project info, account creation); unauthenticated; triggers `POST /api/auth/register`
- **New: login page** — email + password; role-aware redirect post-login
- **New: 5 role-gated dashboards** — `/dashboard/applicant`, `/dashboard/admin`, `/dashboard/reviewer`, `/dashboard/validator`, `/dashboard/auditor`; all protected by session auth; AppShell layout with sidebar nav
- **New: benchmark results page** — `/benchmarks` and `/api/benchmarks`; reads result artefacts from filesystem at build time; renders direct vs Openstrux comparison table
- **New: typed stub API routes** — `/api/proposals`, `/api/proposals/[id]`, and sub-routes (assign, review); `/api/audit`
- **Updated: `/api/intake` and `/api/eligibility`** — switched from `X-Role` header to `getSession()` cookie auth; `src/lib/dal.ts` updated accordingly
- **Env rename**: `NEXTAUTH_SECRET` → `SESSION_SECRET`

## Capabilities

### New Capabilities

- `session-auth`: JWT-based session using `jose`; `src/proxy.ts` route protection; login/logout/register API routes; `src/lib/session.ts` helpers
- `ui-component-library`: Shared React component library on Tailwind CSS v4 + HeadlessUI + lucide-react; UI primitives, layout shells, proposal-domain components
- `landing-page`: Full redesign of `/` with EU grant portal hero and Openstrux benchmark demo section
- `proposal-submission-form`: NLnet-inspired `/submit` redesign; unauthenticated; triggers register API
- `applicant-dashboard`: `/dashboard/applicant` — authenticated view of own proposal status and timeline
- `admin-dashboard`: `/dashboard/admin` — authenticated admin view of all proposals; assign-reviewer workflow
- `reviewer-dashboard`: `/dashboard/reviewer` — authenticated blinded proposal review with review submission
- `validator-dashboard`: `/dashboard/validator` — authenticated validation workflow for shortlisted proposals
- `auditor-dashboard`: `/dashboard/auditor` — authenticated read-only audit event log with filters
- `benchmark-results`: `/benchmarks` page + `/api/benchmarks`; filesystem-based result reader; direct vs Openstrux scorecards

### Modified Capabilities

- `grant-workflow-ui`: Auth requirements, form fields, navigation, and routes all change substantially; existing scenarios for `/submit` and `/admin` superseded by role-gated dashboards and redesigned forms

## Impact

- **New dependencies**: `jose`, `tailwindcss`, `@tailwindcss/forms`, `@headlessui/react`, `lucide-react`
- **Session cookie**: `session` (httpOnly, secure, SameSite=lax) replaces `X-Role`/`X-User-Id` dev headers across all routes
- **Env**: `.env.example` updated — `NEXTAUTH_SECRET` → `SESSION_SECRET`
- **Existing integration tests**: intake/eligibility tests updated to use cookie auth instead of headers
