## Backend Generation Tasks

This task list is executed by BOTH generation paths (direct and Openstrux) against the same baseline.
Each path applies the same functional specification but differs in how code is generated.

The baseline includes **contract stubs** with typed signatures that the generated code must implement.
Tests import only from contract surfaces — internal file structure is free.

> **Note (benchmark-runner-v2):** `tests/integration-mock/` contains a mock-based version of the integration tests using `vitest-mock-extended` — no database required. Run with `pnpm test:integration:mock`. `tests/integration/` remains the real-DB suite used by the benchmark runner.

### Contract surfaces (stubs to implement)

| Surface | Location | What it defines |
|---|---|---|
| Domain schemas | `src/domain/schemas/index.ts` | Zod schemas for entities + API request/response shapes |
| Policy functions | `src/policies/index.ts` | Pure functions: `evaluateEligibility`, `createBlindedPacket`, `isValidTransition`, `getNextStatus` |
| Submission service | `src/server/services/submissionService.ts` | `submitProposal`, `listSubmissions`, `getSubmission` |
| Eligibility service | `src/server/services/eligibilityService.ts` | `runEligibilityCheck` |
| DAL | `src/lib/dal.ts` | `verifySession(req)` → `Principal \| null` |
| Route: intake | `src/app/api/intake/route.ts` | `POST` — validates with `IntakeRequestSchema`, returns `IntakeResponseSchema` |
| Route: eligibility | `src/app/api/eligibility/route.ts` | `POST` — validates with `EligibilityRequestSchema`, returns `EligibilityResponseSchema` |

### P0 — Domain model

- [ ] P0.1 Write `prisma/schema.prisma` — models: `User`, `Call`, `Submission`, `ProposalVersion`, `ApplicantIdentity`, `BlindedPacket`, `EligibilityRecord`, `AuditEvent`
- [ ] P0.2 Do not run any Prisma commands — the benchmark runner applies the schema to the database after generation. Just ensure `prisma/schema.prisma` is complete and correct before finishing.
- [ ] P0.3 Implement `src/domain/schemas/index.ts` — replace stubs with real Zod schemas. Note: `IntakeRequestSchema` identity fields (`legalName`, `email`, `country`, `organisation`) must be **optional** — the intake route accepts submissions without identity data (identity is stored separately when provided)
- [ ] P0.4 Write `src/lib/prisma.ts` — singleton `PrismaClient` instance

### P1 — Intake

- [ ] P1.1 Implement `submitProposal` in `src/server/services/submissionService.ts` — create Submission, ProposalVersion, BlindedPacket, and AuditEvent
- [ ] P1.2 Implement `createBlindedPacket` exported from `src/policies` — strip identity fields from proposal content. Read `tests/unit/blindedPacket.test.ts` to confirm the exact fields that must be included and excluded
- [ ] P1.3 Implement `src/app/api/intake/route.ts` — replace stub: call `verifySession`, return 401/403 before any business logic, validate body with `IntakeRequestSchema`, call `submitProposal`

### P2 — Eligibility

- [ ] P2.1 Implement `evaluateEligibility` exported from `src/policies` — pure function, evaluates inputs against an active rule set, returns `{ status, failureReasons, inputs, activeRules }`
- [ ] P2.2 Implement `runEligibilityCheck` in `src/server/services/eligibilityService.ts` — persist `EligibilityRecord`, transition submission status, write audit event. Derive `activeRules` from the submission's `Call.enabledEligibilityChecks`; fall back to `mvp-profile.md` defaults if the call is not found
- [ ] P2.3 Implement `src/app/api/eligibility/route.ts` — replace stub: call `verifySession`, return 401/403, validate body with `EligibilityRequestSchema`, call `runEligibilityCheck`

### Seed

- [ ] SD.1 Write `prisma/seeds/seed.ts` — upsert one `User` per role and the default `Call`, using IDs, names, roles, and passwords from `openspec/specs/access-policies.md §Dev fixtures`. **Do NOT import bcrypt or any native module** — store a fixed placeholder string for `passwordHash` (e.g. `"$2b$10$dev-placeholder-not-used"`). In P0-P2, `verifySession` uses `X-Role`/`X-User-Id` headers; the `passwordHash` column is never read. Fully idempotent. Run via `pnpm db:seed`.

### Workflow transitions

- [ ] WT.1 Implement `isValidTransition` and `getNextStatus` exported from `src/policies` — per `openspec/specs/workflow-states.md`

### Auth (DAL)

- [ ] AU.1 Implement `verifySession` in `src/lib/dal.ts` — extract principal from `X-Role`/`X-User-Id` headers (dev mode), return `Principal | null`
- [ ] AU.2 Each route handler must call `verifySession` and return 401 (unauthenticated) or 403 (wrong role) before any business logic

### Verification

- [ ] V.1 `tsc --noEmit` exits 0 at the project root
- [ ] V.2 All unit tests in `tests/unit/` pass
- [ ] V.3 All tests in `tests/integration-mock/` pass (no DB required: `pnpm test:integration:mock`)
- [ ] V.4 All integration tests in `tests/integration/` pass (requires `DATABASE_URL`)
