## Backend Generation Tasks

This task list is executed by BOTH generation paths (direct and Openstrux) against the same baseline.
Each path applies the same functional specification but differs in how code is generated.

The baseline includes **contract stubs** with typed signatures that the generated code must implement.
Tests import only from contract surfaces — internal file structure is free.

### Contract surfaces (stubs to implement)

| Surface | Location | What it defines |
|---|---|---|
| Domain schemas | `packages/domain/src/schemas/index.ts` | Zod schemas for entities + API request/response shapes |
| Policy functions | `packages/policies/src/index.ts` | Pure functions: `evaluateEligibility`, `createBlindedPacket`, `isValidTransition`, `getNextStatus` |
| Submission service | `app/web/src/server/services/submissionService.ts` | `submitProposal`, `listSubmissions`, `getSubmission` |
| Eligibility service | `app/web/src/server/services/eligibilityService.ts` | `runEligibilityCheck` |
| DAL | `app/web/src/lib/dal.ts` | `verifySession(req)` → `Principal` |
| Route: intake | `app/web/src/app/api/intake/route.ts` | `POST` — validates with `IntakeRequestSchema`, returns `IntakeResponseSchema` |
| Route: eligibility | `app/web/src/app/api/eligibility/route.ts` | `POST` — validates with `EligibilityRequestSchema`, returns `EligibilityResponseSchema` |

### P0 — Domain model

- [ ] P0.1 Write `prisma/schema.prisma` — models: `Call`, `Submission`, `ProposalVersion`, `ApplicantIdentity`, `BlindedPacket`, `EligibilityRecord`, `AuditEvent`
- [ ] P0.2 Implement `packages/domain/src/schemas/index.ts` — replace stubs with real Zod schemas (signatures are defined, implementation is trivial)
- [ ] P0.3 Write `packages/domain/src/entities/index.ts` — TypeScript interfaces re-exported from schema types

### P1 — Intake

- [ ] P1.1 Implement `submitProposal` in `app/web/src/server/services/submissionService.ts` — create submission, version, blinded packet, audit event (in a Prisma transaction)
- [ ] P1.2 Implement `createBlindedPacket` exported from `packages/policies/src` — strip identity fields per `specs/access-policies.md`
- [ ] P1.3 Implement `app/web/src/app/api/intake/route.ts` — replace stub: validate with `IntakeRequestSchema`, call `verifySession`, call `submitProposal`

### P2 — Eligibility

- [ ] P2.1 Implement `evaluateEligibility` exported from `packages/policies/src` — pure function, evaluates inputs against active rule set
- [ ] P2.2 Implement `runEligibilityCheck` in `app/web/src/server/services/eligibilityService.ts` — persist EligibilityRecord, transition submission status, write audit event
- [ ] P2.3 Implement `app/web/src/app/api/eligibility/route.ts` — replace stub: validate with `EligibilityRequestSchema`, call `verifySession`, call `runEligibilityCheck`

### Workflow transitions

- [ ] WT.1 Implement `isValidTransition` and `getNextStatus` exported from `packages/policies/src` — per `specs/workflow-states.md`

### Auth (DAL)

- [ ] AU.1 Implement `verifySession` in `app/web/src/lib/dal.ts` — extract principal from `X-Role`/`X-User-Id` headers (dev mode), return `Principal | null`
- [ ] AU.2 Each route handler must call `verifySession` and return 401 (unauthenticated) or 403 (wrong role) before any business logic

### Verification

- [ ] V.1 `tsc --noEmit` exits 0 in `app/web/`
- [ ] V.2 All unit tests in `tests/unit/` pass
- [ ] V.3 All integration tests in `tests/integration/` pass (requires DB)
