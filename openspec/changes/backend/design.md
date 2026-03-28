# Backend Design — Grant Workflow

## Overview

This document describes the technical design for the direct TypeScript generation path of the grant workflow backend.

## File Structure

```
prisma/
  schema.prisma              — Prisma 6 schema with all entities
  seeds/
    seed.ts                  — Dev-mode seed (users + default Call)

src/
  lib/
    prisma.ts                — Singleton PrismaClient
  domain/
    schemas/
      index.ts               — Zod schemas (already exists, no @generated-stub to remove)
  policies/
    index.ts                 — All pure policy functions (evaluateEligibility, createBlindedPacket,
                               isValidTransition, getNextStatus, checkAccess, MVP_DEFAULT_RULES)
  server/
    services/
      submissionService.ts   — submitProposal, listSubmissions, getSubmission
      eligibilityService.ts  — runEligibilityCheck
  app/
    api/
      intake/route.ts        — POST /api/intake (session → validate → submitProposal)
      eligibility/route.ts   — POST /api/eligibility (session → validate → runEligibilityCheck)

packages/
  policies/
    src/
      index.ts               — Re-export barrel (already correct: export * from ../../../src/policies/index)
```

## Key Technical Decisions

### 1. Dual policy export path
All policy implementations live in `src/policies/index.ts`. The `packages/policies/src/index.ts` is already a re-export barrel; it just needs the stub marker removed.

### 2. PrismaClient singleton
`src/lib/prisma.ts` exports a single `prisma` instance using the standard global singleton pattern to avoid exhausting connections in development.

### 3. Service layer: no transactions exposed externally
`submitProposal` uses `prisma.$transaction` internally. Services are async functions taking typed inputs and returning typed outputs — no Prisma types leak to callers.

### 4. Mock-compatibility
The integration-mock tests use `vitest-mock-extended` to mock `PrismaClient`. Services must construct a `new PrismaClient()` directly (not use a module-level singleton import) — OR the singleton must be importable for overriding.

Looking at the test setup (`tests/integration-mock/setup.ts`), it mocks `@prisma/client` at the module level:
```ts
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(() => mockPrisma),
}));
```
This means `src/lib/prisma.ts` must call `new PrismaClient()` (not cache it across module reloads). The singleton pattern with a global still works because `vi.mock` replaces the constructor.

### 5. Prisma schema design
Tables use snake_case per Prisma convention with `@map` annotations to keep TS model names PascalCase. Cascade deletes from Submission to ProposalVersion, ApplicantIdentity, EligibilityRecord, BlindedPacket.

### 6. Seed script
Uses `node --experimental-strip-types prisma/seeds/seed.ts` per package.json prisma.seed config. Seeds 5 dev users (bcrypt-hashed passwords) + 1 default Call.

### 7. Route handlers
Inline pipeline per spec (generation-direct requirement): `verifySession → safeParse → service call → response`. No abstraction layer. Already stubbed in `src/app/api/intake/route.ts` and `src/app/api/eligibility/route.ts` — replace the 501 line with the service call.

### 8. MVP_DEFAULT_RULES constant
Exported from `src/policies/index.ts` as a `string[]` constant — the ordered list of 6 eligibility check names.

### 9. EligibilityRecord status field
The Prisma model stores `status` as a `String` (not enum) to avoid migration friction. Values are `"eligible"`, `"ineligible"`, `"pending"`. The service always sets one of the first two.

### 10. Active rule derivation in eligibilityService
`runEligibilityCheck` tries `prisma.call.findUnique({ where: { id: submission.callId } })`. If found and has `enabledEligibilityChecks`, those are used; otherwise falls back to `MVP_DEFAULT_RULES`. The mock tests don't mock `call.findUnique`, so the service must handle `null` gracefully (fall back to defaults).

## Acceptance Criteria Map

| Criterion | Implementation |
|-----------|----------------|
| `evaluateEligibility` pure function | `src/policies/index.ts` |
| `createBlindedPacket` strips identity | `src/policies/index.ts` |
| `isValidTransition` / `getNextStatus` | `src/policies/index.ts` |
| `checkAccess` policies | `src/policies/index.ts` |
| `MVP_DEFAULT_RULES` with 6 checks | `src/policies/index.ts` |
| `submitProposal` atomic transaction | `src/server/services/submissionService.ts` |
| `runEligibilityCheck` with audit | `src/server/services/eligibilityService.ts` |
| POST /api/intake with 401 guard | `src/app/api/intake/route.ts` |
| POST /api/eligibility with 401 guard | `src/app/api/eligibility/route.ts` |
| Prisma schema all entities | `prisma/schema.prisma` |
| Seed dev users + default Call | `prisma/seeds/seed.ts` |
| `packages/policies/src` barrel | already correct |
| `tsc --noEmit` clean | strict types, no `any` |
| `pnpm test:unit` pass | policies impl |
| `pnpm test:integration:mock` pass | services + mock setup |
