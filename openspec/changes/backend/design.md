# Design: Backend Implementation (Direct TypeScript Path)

## Overview

Implements the full backend for the grant workflow system by replacing all `@generated-stub` markers with real TypeScript. The approach is straightforward: hand-write each file at its natural in-tree path with no intermediate representation.

## Architecture

```
prisma/schema.prisma            ← DB schema (all models)
prisma/seeds/seed.ts            ← DEV fixture seed

src/lib/prisma.ts               ← Singleton PrismaClient

src/domain/schemas/index.ts     ← Zod schemas (already correct, remove stub marker)

src/policies/index.ts           ← Pure policy functions (real implementations)
packages/policies/src/index.ts  ← Re-export barrel → src/policies/index.ts (already done)

src/server/services/
  submissionService.ts          ← submitProposal (creates Submission + ProposalVersion + BlindedPacket + AuditEvent)
  eligibilityService.ts         ← runEligibilityCheck (evaluate + persist EligibilityRecord + update status + AuditEvent)

src/app/api/intake/route.ts     ← POST: verifySession → validate → submitProposal
src/app/api/eligibility/route.ts ← POST: verifySession → validate → runEligibilityCheck
```

## Key Technical Decisions

### 1. Prisma singleton pattern
`src/lib/prisma.ts` exports a module-level `prisma` singleton via `new PrismaClient()`. The integration-mock tests mock `@prisma/client` at the module level (`vi.mock("@prisma/client", () => ({ PrismaClient: vi.fn(() => mockPrisma) }))`), which intercepts the singleton constructor. Services import `prisma` from `src/lib/prisma.ts`.

### 2. No `$transaction` in service layer (mock compatibility)
The integration-mock tests mock individual model methods (`mockPrisma.submission.create`, etc.) and assert they are called directly. Using `prisma.$transaction(async (tx) => {...})` would mean the callback is never executed under the mock (since `$transaction` itself is a no-op mock). Therefore services call individual Prisma operations sequentially rather than inside a `$transaction` callback. The real DB integration tests can pass without transaction wrapping for the MVP scope.

### 3. Pure policy functions live in `src/policies/index.ts`
All implementations — `evaluateEligibility`, `createBlindedPacket`, `isValidTransition`, `getNextStatus`, `checkAccess` — are pure functions with no DB dependency. `packages/policies/src/index.ts` is already a `export * from "../../../src/policies/index"` re-export and requires no changes.

### 4. Eligibility rule evaluation
Each rule is a named check evaluated only when present in `activeRules`:
- Boolean rules (4): pass if value is `true`
- Ternary rule (`meetsEuropeanDimension`): pass if `"true"` or `"not_applicable"`
- Budget rule (`requestedBudgetKEur`): pass if value ≤ 500

`MVP_DEFAULT_RULES` includes all 6 checks in the order from `mvp-profile.md`.

### 5. Blinded packet content
`createBlindedPacket` copies only the five evaluable fields from `ProposalVersion`: `title`, `abstract`, `requestedBudgetKEur`, `budgetUsage`, `tasksBreakdown`. All identity fields are excluded. The `proposalVersionId` is stored as a top-level field on the returned object (not inside `content`).

### 6. Workflow state machine
`isValidTransition` uses a static allowed-transitions map. `getNextStatus` uses a static event-to-status map keyed on `${currentStatus}:${event}`.

### 7. Route handlers: inline pipeline
Each route handler implements the full pipeline inline — no generated wrapper layer:
1. `verifySession(req)` → 401 if null
2. Role check → 403 if wrong role
3. `req.json()` + Zod `.safeParse()` → 400 if invalid
4. Service call → return result

### 8. Domain schemas
`src/domain/schemas/index.ts` already contains correct Zod schemas. Only the `@generated-stub` comment needs to be removed.

### 9. Prisma schema design
- All tables use `snake_case` names via `@@map()`
- `Submission.status` stored as `String` (not enum) for schema migration flexibility
- `Call.enabledEligibilityChecks` stored as `String[]`
- `EligibilityRecord.inputs` stored as `Json`
- Cascade deletes from `Submission` to child records

### 10. Seed actor IDs
Canonical dev fixture users match `openspec/specs/access-policies.md` exactly. Default `Call` record matches `openspec/specs/access-policies.md §Dev fixtures` and `mvp-profile.md §Default call configuration`.

## Acceptance Criteria Mapping

| Criterion | Implementation |
|-----------|----------------|
| `tsc --noEmit` exits 0 | Strict types throughout; no `any`; Zod-inferred types only |
| `pnpm test:unit` passes | `src/policies/index.ts` replaces stubs; route handlers already have correct auth/validation |
| `pnpm test:integration:mock` passes | Services use direct Prisma calls (not `$transaction`) so mocks intercept correctly |
| `pnpm test:integration` passes (DB) | Full Prisma schema; seed script; services write real records |
| No `@generated-stub` markers | All stub markers removed |

## Files to Create / Modify

| File | Action |
|------|--------|
| `prisma/schema.prisma` | **Create** |
| `prisma/seeds/seed.ts` | **Create** |
| `src/lib/prisma.ts` | **Create** |
| `src/domain/schemas/index.ts` | **Modify** (remove stub marker) |
| `src/policies/index.ts` | **Modify** (replace stub implementations) |
| `packages/policies/src/index.ts` | **No change** (already correct re-export) |
| `src/server/services/submissionService.ts` | **Modify** (replace stubs) |
| `src/server/services/eligibilityService.ts` | **Modify** (replace stub) |
| `src/app/api/intake/route.ts` | **Modify** (replace 501) |
| `src/app/api/eligibility/route.ts` | **Modify** (replace 501) |
