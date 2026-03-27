## Why

The current frontend is a bare scaffold: 5 minimal pages with no authentication, no shared components, and inline CSS. Before this application can serve as a credible benchmark demonstrating Openstrux against direct AI generation, it needs a production-quality frontend — complete role-based auth, a real EU-grant-portal experience, and polished shared components that showcase what the target application actually looks like.

## What Changes

- **New: session auth layer** — custom `jose` JWT session with httpOnly cookie; Next.js 16 `proxy.ts` protecting `/dashboard/*` routes; login/register/logout API routes (functionally implemented with dev-user stubs)
- **New: Tailwind CSS v4** installed alongside existing CSS custom properties; all new components use Tailwind utility classes
- **New: shared component library** — `src/components/ui/` (Button, Badge, Card, DataTable, Modal, Select, FormField, Spinner), `src/components/layout/` (AppShell, PublicNav, DashboardHeader, SectionSeparator), `src/components/proposal/` (ProposalTable, StatusBadge)
- **New: landing page redesign** — Section 1: EU grant portal hero + feature cards + process timeline + privacy accordion + CTAs; Section 2: Openstrux benchmark demo with manifesto points and link to `/benchmarks`
- **New: submit page redesign** — NLnet-inspired multi-section form (contact info + project info + account creation); unauthenticated; creates applicant user + submission via `POST /api/auth/register`
- **New: login page** — email + password; role-aware redirect post-login
- **New: 5 dashboard pages** — `/dashboard/applicant`, `/dashboard/admin`, `/dashboard/reviewer`, `/dashboard/validator`, `/dashboard/auditor`; all role-gated; modern AppShell layout with sidebar nav
- **New: benchmark results page** — `/benchmarks` fully implemented; reads `../openstrux/benchmarks/results/` at build time; renders comparison table (direct vs openstrux, tokens, turns, test pass rate)
- **New: typed stub API routes** — `/api/proposals`, `/api/proposals/[id]`, `/api/proposals/[id]/assign`, `/api/proposals/[id]/review`, `/api/proposals/[id]/validate`, `/api/audit`
- **Updated: existing stubs** — `/api/intake` and `/api/eligibility` updated to use `getSession()` instead of `X-Role` header; `src/lib/dal.ts` updated accordingly
- **Env var rename**: `NEXTAUTH_SECRET` → `SESSION_SECRET`
- **No change to**: `prisma/schema.prisma` (owned by backend generation)

## Capabilities

### New Capabilities

- `session-auth`: JWT-based session management using `jose`; `src/proxy.ts` route protection; login/logout/register API routes with dev-user stubs; `src/lib/session.ts` helpers
- `ui-component-library`: Shared React component library built on Tailwind CSS v4 + HeadlessUI + lucide-react; covers UI primitives, layout shells, and proposal-domain components
- `landing-page`: Full redesign of `/` with EU grant portal hero section and Openstrux benchmark demo section; public-facing, no auth required
- `proposal-submission-form`: NLnet-inspired `/submit` form redesign with contact info, project info, and account creation sections; unauthenticated; triggers register API
- `applicant-dashboard`: `/dashboard/applicant` — authenticated view of own proposal status, timeline, and feedback
- `admin-dashboard`: `/dashboard/admin` — authenticated admin view of all proposals, stats, assign-reviewer workflow
- `reviewer-dashboard`: `/dashboard/reviewer` — authenticated blinded proposal review with review submission form
- `validator-dashboard`: `/dashboard/validator` — authenticated validation workflow for shortlisted proposals
- `auditor-dashboard`: `/dashboard/auditor` — authenticated read-only audit event log with filters
- `benchmark-results`: `/benchmarks` page + `/api/benchmarks` fully implemented; reads result artefacts from filesystem; renders comparison scorecards

### Modified Capabilities

- `grant-workflow-ui`: Routes, auth requirements, form fields, and navigation all change substantially; existing scenarios for `/submit` and `/admin` are superseded by new role-gated dashboards and redesigned forms

## Impact

- **New dependencies**: `jose` (JWT), `tailwindcss`, `@tailwindcss/forms`
- **Auth routes**: 3 new functional routes under `/api/auth/`
- **Stub routes**: 5 new typed stubs under `/api/proposals/` and `/api/audit/`
- **Benchmark route**: 1 fully-implemented server route `/api/benchmarks`
- **Session cookie**: `session` (httpOnly, secure, SameSite=lax) replaces `X-Role`/`X-User-Id` dev headers
- **Env**: `.env.example` — `NEXTAUTH_SECRET` → `SESSION_SECRET`
- **Existing tests**: unit tests for policies and schemas unaffected; integration tests for intake/eligibility may need header→cookie auth update
