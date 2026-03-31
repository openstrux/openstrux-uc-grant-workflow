## Context

The grant workflow has a complete frontend (Next.js App Router) and test suite (vitest) but no backend. Route handlers return 501 stubs, no Prisma schema exists, and no service logic is implemented. This design covers the direct TypeScript generation path: all files are hand-written with no intermediate representation or code generation toolchain.

Stack: TypeScript (strict), Next.js 16 App Router, Prisma 6 (PostgreSQL 18), Zod 3, JWT-based role middleware.

## Goals / Non-Goals

**Goals:**
- Implement all contract stubs identified in the proposal (policies, services, route handlers, Prisma schema + seed)
- Pass `tsc --noEmit`, `pnpm test:unit`, `pnpm test:integration:mock`
- Satisfy all acceptance criteria in `openspec/changes/backend/specs/`

**Non-Goals:**
- P3–P6 features (review scoring, clarification, validation, audit export)
- UI components (frontend is pre-built)
- External IdP integration
- Raw SQL — Prisma ORM is sufficient for all operations

## Decisions

### D1: Sequential writes instead of `$transaction` in `submitProposal`

Spec requirement: `proposal-intake/spec.md` notes that `prisma.$transaction()` is not supported by the mock test suite (`vitest-mock-extended` intercepts individual model methods). Sequential individual writes are used instead. Real-DB integration tests verify end-to-end correctness; unit/mock tests verify each write in isolation.

Alternatives considered: `$transaction` callback — rejected because it breaks mock tests.

### D2: `src/policies/index.ts` holds all implementations; `packages/policies/src/index.ts` is a re-export barrel

Tests import from both paths. To avoid duplication and ensure consistency, all logic lives in `src/policies/index.ts`. The packages barrel simply re-exports everything with `export * from "../../../src/policies/index"`. The barrel file already exists as a stub with the correct re-export — it requires no changes.

### D3: `src/lib/prisma.ts` — singleton PrismaClient

A simple module-level singleton pattern with `globalThis` caching prevents multiple client instances during hot-reload in development. This is the standard Next.js + Prisma pattern.

### D4: Dev-mode authentication via `X-Role` / `X-User-Id` headers

The `verifySession` function in `src/lib/dal.ts` already reads from the JWT session cookie. Route handlers and services can use it as-is. No changes needed to `dal.ts`.

### D5: `activeRules` derived from `Call.enabledEligibilityChecks`; fallback to `MVP_DEFAULT_RULES`

`eligibilityService.runEligibilityCheck` fetches the `Call` linked to the submission. If found, its `enabledEligibilityChecks` array is used. If not found (e.g., test data without a real Call), `MVP_DEFAULT_RULES` is used as fallback.

### D6: Prisma schema design

Models match `openspec/specs/domain-model.md` entity names exactly: PascalCase models, snake_case table names. All relations use cascade deletes where appropriate (e.g., `Submission` deletion cascades to `ProposalVersion`, `ApplicantIdentity`, `EligibilityRecord`, `AuditEvent`). `BlindedPacket` cascades from `ProposalVersion`.

### D7: `prisma/seeds/seed.ts` — uses `node --experimental-strip-types`

`package.json` already configures `"seed": "node --experimental-strip-types prisma/seeds/seed.ts"`. The seed file is plain TypeScript with no build step required.

## Risks / Trade-offs

- **Sequential writes are not truly atomic**: If the process crashes between writes, partial state can be persisted. Mitigation: acceptable for P0 scope; real transactions should replace this in production once mock test infrastructure is updated.
- **`submittedAt` defaults**: Prisma `@default(now())` handles this at the DB level. Services do not need to pass `submittedAt` explicitly.
- **Mock test auditEvent call count**: The eligibility service calls `auditEvent.create` once, but intake service also calls it. Tests that chain both (`createTestSubmission` + `runEligibilityCheck`) will accumulate calls — tests use `find()` to locate specific audit entries by `eventType`, which is robust.

## Migration Plan

1. Create `prisma/schema.prisma` with all models
2. Run `prisma db push` (dev) or `prisma migrate dev` (CI) to apply schema
3. Run `prisma db seed` to insert dev fixtures
4. Implement all TypeScript files in order (policies → services → route handlers)
5. Run `tsc --noEmit` and `pnpm test:unit` + `pnpm test:integration:mock` after each file

## Open Questions

None — all requirements are fully specified in the capability specs.
