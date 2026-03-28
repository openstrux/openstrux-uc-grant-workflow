# Backend Design — Direct TypeScript Path

## Technical decisions

### File structure

All implementations follow their natural in-tree paths:
- `prisma/schema.prisma` — Prisma schema (PostgreSQL, all P0-P2 models)
- `prisma/seeds/seed.ts` — Dev-fixture seed (5 users + default Call)
- `src/domain/schemas/index.ts` — Already complete; remove `@generated-stub` marker
- `src/policies/index.ts` — All pure policy functions (evaluateEligibility, createBlindedPacket, isValidTransition, getNextStatus, checkAccess)
- `packages/policies/src/index.ts` — Re-export barrel only; already wired; remove marker
- `src/lib/prisma.ts` — Prisma client singleton (`new PrismaClient()`)
- `src/server/services/submissionService.ts` — submitProposal + read helpers
- `src/server/services/eligibilityService.ts` — runEligibilityCheck
- `src/app/api/intake/route.ts` — Replace 501 with service call
- `src/app/api/eligibility/route.ts` — Replace 501 with service call

### No Prisma $transaction in services

The integration-mock tests mock individual Prisma operations (`submission.create`, etc.) via `vitest-mock-extended`'s `mockDeep`. The `$transaction` callback pattern would prevent the individual mocks from being invoked, breaking those tests. Services instead call operations sequentially; `$transaction` is reserved for real DB where ACID is enforced.

### Policy module dual export

All implementations live in `src/policies/index.ts`. The `packages/policies/src/index.ts` barrel (`export * from "../../../src/policies/index"`) is already correct — just needs the `@generated-stub` comment removed.

### Prisma schema design

- Enums: `ProposalStatus`, `Role` — lowercase values matching domain model
- Models: User, Call, Submission, ProposalVersion, ApplicantIdentity, BlindedPacket, EligibilityRecord, AuditEvent
- snake_case DB column names via `@map`, camelCase Prisma field names
- Cascade deletes: ProposalVersion/ApplicantIdentity/EligibilityRecord cascade on Submission delete

### Active rules derivation

`runEligibilityCheck` tries to look up `submission → call → enabledEligibilityChecks`. If either lookup returns null/undefined (mocked as default in tests), it falls back to `MVP_DEFAULT_RULES`.

### Acceptance criteria mapping

| Criterion | Implementation |
|---|---|
| `tsc --noEmit` exits 0 | All files use strict TypeScript, no `any` |
| `pnpm test:unit` passes | `evaluateEligibility`, `createBlindedPacket`, `isValidTransition`, `getNextStatus`, `checkAccess` implemented as pure functions |
| `pnpm test:integration:mock` passes | Services call individual Prisma ops (not `$transaction`); mock intercepts via `vi.mock("@prisma/client")` |
| Route auth/validation tests | Route handlers unchanged except replacing 501 with service call |
