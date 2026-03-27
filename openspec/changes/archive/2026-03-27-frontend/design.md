## Context

The grant-workflow app is a Next.js 16 / React 19 project using the App Router. It has 5 bare pages, no authentication middleware, an empty `src/components/` directory, and CSS custom properties for styling. HeadlessUI 2.1 and lucide-react are already installed. `bcrypt` is in devDeps. The app serves two purposes: (1) a working EU grant portal prototype, and (2) a benchmark harness demonstrating Openstrux vs direct AI generation — so the UI must look credible for both audiences.

Key constraints:
- **Next.js 16** renamed `middleware.ts` → `proxy.ts`; the export is `proxy()` not `middleware()`; runtime is Node.js only (no Edge)
- **No Prisma schema changes** — schema is owned by the backend stub generation phase
- **Backend routes stay as stubs** — auth routes are the only exception (they must work)
- **Benchmark results are read from the filesystem** (`../openstrux/benchmarks/results/`)

## Goals / Non-Goals

**Goals:**
- Full session auth: login, logout, register, httpOnly cookie, proxy-based route protection
- Production-quality shared component library on Tailwind + HeadlessUI + lucide
- Fully implemented landing page and submit page
- 5 role-gated dashboard pages that render real UI (with stub data)
- Benchmark results page that actually reads and renders result artefacts
- All new backend routes typed and stubbed with correct request/response shapes
- Existing auth mechanism (`X-Role` header) replaced by `getSession()` throughout

**Non-Goals:**
- Real database reads in any route other than auth (which uses hardcoded dev users)
- Prisma schema changes
- Email/OAuth authentication
- Dark mode
- Mobile-first responsive layout (desktop-first is sufficient for the benchmark)

## Decisions

### D1: Next.js 16 Proxy instead of Middleware

Next.js 16 deprecated `middleware.ts` in favour of `proxy.ts` with `export function proxy()`. The runtime is Node.js only — Edge runtime is no longer supported. We use `proxy.ts` at `src/proxy.ts` with the standard matcher `/((?!api|_next/static|_next/image|.*\\.png$).*)` covering all page routes. The proxy reads the `session` cookie, decrypts it via `getSession()`, and redirects unauthenticated requests to `/login`.

*Alternative considered: keep old middleware.ts for backward compat.* Rejected — Next.js 16 emits deprecation warnings and the rename is a one-line codemod.

### D2: Custom jose JWT instead of NextAuth

NextAuth v5's auth middleware is designed for the Edge runtime and does not integrate cleanly with Next.js 16's Node.js-only proxy. The official Next.js 16 auth guide recommends a custom `jose`-based session. We implement `src/lib/session.ts` with `encrypt()`, `decrypt()`, `createSession()`, `deleteSession()`, and `getSession()`. The JWT is signed with `SESSION_SECRET` (renamed from `NEXTAUTH_SECRET`). Payload: `{ userId, role, expiresAt }`. Cookie: httpOnly, secure, SameSite=lax, 7-day expiry.

*Alternative considered: NextAuth v5 credentials provider.* Rejected — incompatible with Next.js 16 proxy runtime; adds a heavy dependency for what is functionally a simple credential check.

### D3: Tailwind CSS v4 alongside CSS custom properties

Tailwind v4 is installed and configured. Existing CSS custom properties in `globals.css` are retained as semantic tokens (and mapped into Tailwind's theme via `@theme`). New components use Tailwind utility classes. This gives the best of both worlds: the existing token vocabulary stays intact for the backend-generated code to reference, and new UI gets full Tailwind ergonomics.

*Alternative considered: CSS custom properties only.* Rejected — manually building all component styles in CSS is feasible but slower and produces less consistent output than Tailwind utilities.

### D4: Component library structure

Components live in `src/components/` with three sub-namespaces:
- `ui/` — primitive design-system components (Button, Badge, Card, etc.)
- `layout/` — structural shells (AppShell, PublicNav, DashboardHeader, SectionSeparator)
- `proposal/` — domain-specific composites (ProposalTable, StatusBadge)

All components are typed with explicit props interfaces. HeadlessUI handles accessibility for Modal and Select. lucide-react provides all icons — no other icon library.

### D5: Auth routes are functionally implemented; business routes are typed stubs

Auth routes (`/api/auth/login`, `/api/auth/logout`, `/api/auth/register`) must work for the frontend to be usable at all. They validate against the same hardcoded dev-user list used by the existing seed (5 users: applicant, admin, reviewer, validator, auditor with known passwords). All other new routes (`/api/proposals`, `/api/audit`, etc.) return typed empty responses (`[]` or `null`) — correctly shaped but no DB access.

### D6: Benchmark results read at request time via filesystem

`/api/benchmarks` reads `../openstrux/benchmarks/results/` at request time (not build time) to avoid stale data in development. Each subdirectory slug matching `YYYYMMDD-HHmmss-<path>` is a result. The route reads `generation-meta.json` and `test-unit.json` from each, merges them into a `BenchmarkResult` shape, and returns the array sorted by date descending. The `/benchmarks` page calls this route and renders a comparison table. If the results directory doesn't exist, returns an empty array (graceful degradation).

### D7: Dashboard routing — all under `/dashboard/<role>`

Rather than `/admin`, `/reviewer`, etc. as separate top-level paths, all authenticated dashboards live under `/dashboard/<role>`. The existing `/admin` path is retained for the proposal detail and eligibility sub-routes (they are admin-only actions accessed from the admin dashboard).

Proxy protects `/dashboard/*`. The login route redirects to the correct dashboard based on the role in the JWT: `applicant → /dashboard/applicant`, `admin → /dashboard/admin`, etc.

## Risks / Trade-offs

- **Dev-user hardcoding in auth routes**: Auth routes validate against hardcoded credentials. This is intentional for the benchmark phase and must be replaced before any real deployment. → Mitigation: mark all hardcoded credential logic with `// @dev-only` comments and document in `.env.example`.

- **Filesystem read for benchmarks**: `/api/benchmarks` uses `fs.readdir` / `fs.readFile` on a path relative to `process.cwd()`. In Docker or Vercel deployments the results directory may not exist. → Mitigation: try/catch with empty-array fallback; document the expected path in a comment.

- **Tailwind v4 + CSS custom properties coexistence**: Tailwind v4's new `@theme` block needs careful mapping to avoid duplicate variable definitions. → Mitigation: keep CSS custom properties as the source of truth; reference them in `@theme` via `var()`.

- **bcrypt in devDeps**: `bcrypt` is currently a devDependency used only by seeds. Auth routes call `bcrypt.compare()` at runtime. → Mitigation: move `bcrypt` to `dependencies` in `package.json`.

- **Existing integration tests**: Tests for `/api/intake` and `/api/eligibility` may use `X-Role` / `X-User-Id` headers directly. After this change those headers are ignored; tests must set a valid session cookie instead. → Mitigation: update test helpers to call `/api/auth/login` and carry the cookie.

## Migration Plan

1. Install new dependencies (`jose`, `tailwindcss`, `@tailwindcss/forms`)
2. Move `bcrypt` from devDeps to deps
3. Rename `NEXTAUTH_SECRET` → `SESSION_SECRET` in `.env.example` and `.env` (if present)
4. Add `src/lib/session.ts` and `src/proxy.ts`
5. Add auth routes; update `dal.ts` to use `getSession()`
6. Build component library (`src/components/`)
7. Implement pages in order: login → landing → submit → dashboards → benchmarks
8. Add new stub API routes
9. Update existing stubs (`/api/intake`, `/api/eligibility`) to use `getSession()`
10. Run `pnpm test:unit` — fix any regressions
11. Manual smoke test: submit flow, login flow, each dashboard

Rollback: all changes are additive or replace stub implementations. The only breaking change is removing `X-Role` header auth from `/api/intake` and `/api/eligibility`. Rollback is a git revert.

## Open Questions

- None — all design decisions resolved.
