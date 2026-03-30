## ADDED Requirements

### Requirement: Strux-first generation ordering
The system SHALL write `.strux` source files before implementing any route handler. `.strux` files are first-class deliverables — the generation path MUST NOT skip directly to TypeScript.

Required `.strux` files:
- `strux.context` (project root) — project-wide controller, DPO, named `@source`/`@target`
- `pipelines/strux.context` — domain-level overrides
- `openspec/specs/p0-domain-model.strux` — `@type` definitions for all P0-P2 entities
- `pipelines/intake/p1-intake.strux` — intake pipeline panel
- `pipelines/eligibility/p2-eligibility.strux` — eligibility pipeline panel

#### Scenario: Strux files produced before routes
- **WHEN** generation is complete
- **THEN** all five `.strux` files listed above exist in the worktree

#### Scenario: strux build attempted after writing source
- **WHEN** `.strux` files have been written
- **THEN** `node .openstrux/cli/strux.mjs build --explain` is run and any compile errors are fixed before gap-filling

### Requirement: Gap-fill after strux build
After `strux build`, the system SHALL implement the remaining TypeScript stubs that the Openstrux toolchain does not generate. These gap-fills are hand-written TypeScript.

Gap-fill files:
- `prisma/schema.prisma`
- `prisma/seeds/seed.ts`
- `src/domain/schemas/index.ts`
- `src/policies/index.ts` and `packages/policies/src/index.ts`
- `src/lib/prisma.ts`
- `src/server/services/submissionService.ts`
- `src/server/services/eligibilityService.ts`
- `src/app/api/intake/route.ts`
- `src/app/api/eligibility/route.ts`

#### Scenario: All gap-fill stubs replaced
- **WHEN** generation is complete
- **THEN** every gap-fill file listed above exists with no `@generated-stub` markers

### Requirement: Routes as thin wrappers calling strux-generated handlers
Route handlers MUST be thin gap-fills only. Each route handler SHALL: verify the session, return 401/403 if unauthenticated, validate input with the Zod schema, then delegate to the strux-generated pipeline handler imported from `@openstrux/build/pipelines/*`. Business logic MUST NOT be re-implemented in the route handler.

#### Scenario: Route delegates to strux pipeline
- **WHEN** a valid request is received
- **THEN** the route handler calls the strux-generated pipeline handler, not a hand-written service function

#### Scenario: Route rejects unauthenticated request
- **WHEN** a request arrives with no valid session
- **THEN** the handler returns HTTP 401 before calling the pipeline handler

### Requirement: Acceptance criteria
All generated artifacts (`.strux` + TypeScript gap-fills) MUST satisfy:
- `tsc --noEmit` exits 0 at project root
- `pnpm test:unit` passes
- `pnpm test:integration:mock` passes (no DB required)
- `pnpm test:integration` passes (requires `DATABASE_URL`)

#### Scenario: TypeScript compiles cleanly
- **WHEN** `tsc --noEmit` is run at the project root
- **THEN** exit code is 0 and no type errors are reported

#### Scenario: Unit tests pass
- **WHEN** `pnpm test:unit` is run
- **THEN** all tests in `tests/unit/` pass
