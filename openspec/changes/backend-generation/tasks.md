## Backend Generation Tasks

This task list is executed by BOTH generation paths (direct and Openstrux) against the same baseline.
Each path applies the same functional specification but differs in how code is generated.

### P0 — Domain model

- [ ] P0.1 Write `prisma/schema.prisma` — models: `Call`, `Submission`, `ProposalVersion`, `ApplicantIdentity`, `BlindedPacket`, `EligibilityRecord`, `AuditEvent`
- [ ] P0.2 Write `packages/domain/src/schemas/index.ts` — Zod schemas for all entities
- [ ] P0.3 Write `packages/domain/src/entities/index.ts` — TypeScript interfaces matching schemas

### P1 — Intake

- [ ] P1.1 Write `packages/policies/src/workflow/submitProposal.ts` — create submission, version, blinded packet, audit event (in a Prisma transaction)
- [ ] P1.2 Write `app/web/src/app/api/intake/route.ts` — replace stub with real POST handler using Zod validation + submitProposal service
- [ ] P1.3 Write blinded packet mapper — strip identity fields per `specs/access-policies.md`

### P2 — Eligibility

- [ ] P2.1 Write `packages/policies/src/eligibility/evaluateEligibility.ts` — pure function, evaluates inputs against active rule set
- [ ] P2.2 Write `packages/policies/src/workflow/runEligibilityCheck.ts` — persist EligibilityRecord, transition submission status, write audit event
- [ ] P2.3 Write `app/web/src/app/api/eligibility/route.ts` — replace stub with real POST handler

### Access middleware

- [ ] AM.1 Write `app/web/src/server/auth/middleware.ts` — extract JWT claims, build principal
- [ ] AM.2 Write `packages/policies/src/access/checkAccess.ts` — principal + resource + operation policy evaluation

### Verification

- [ ] V.1 `tsc --noEmit` exits 0 in `app/web/`
- [ ] V.2 All unit tests in `tests/unit/` pass
- [ ] V.3 All integration tests in `tests/integration/` pass (requires DB)
