## Architecture

The backend is a layered TypeScript application with a contract-first design. Typed stubs define the contract surfaces; tests import only from these surfaces. Internal file structure within packages is free.

### Contract surfaces

```
packages/domain/src/schemas/index.ts    Zod schemas (entity + API request/response)
                                        Single source of truth — all types via z.infer<>

packages/policies/src/index.ts          Barrel exporting pure business-logic functions:
                                        evaluateEligibility, createBlindedPacket,
                                        isValidTransition, getNextStatus

src/lib/dal.ts                  verifySession(req) → Principal | null

src/server/services/
  submissionService.ts                  submitProposal, listSubmissions, getSubmission
  eligibilityService.ts                 runEligibilityCheck

src/app/api/
  intake/route.ts                       POST — validates with IntakeRequestSchema
  eligibility/route.ts                  POST — validates with EligibilityRequestSchema

prisma/schema.prisma                    Database models matching domain model
```

### Internal structure (free)

The `packages/policies/src/` barrel may delegate to internal modules:
```
packages/policies/src/
  index.ts              ← barrel (contract surface, tested)
  eligibility/          ← internal (free to organise)
  workflow/             ← internal (free to organise)
  intake/               ← internal (free to organise)
```

## Key design decisions

**Identity separation at the DB level**: `ApplicantIdentity` is a separate Prisma model. The route handler that creates a submission stores identity separately and only returns a `submissionId`.

**BlindedPacket is created eagerly**: On submission, a blinded packet is created immediately (not lazily). The packet JSON strips all identity fields at the mapper level.

**Eligibility is pure + recorded**: `evaluateEligibility()` is a pure function (unit-testable, exported from policies barrel). `runEligibilityCheck()` in the service layer wraps it, persists the result, and transitions submission status.

**Audit events**: Both `submitProposal` and `runEligibilityCheck` write audit events inside Prisma transactions.

**Auth (DAL)**: Route handlers call `verifySession(req)` from `src/lib/dal.ts`. For P0-P2, uses dev-mode `X-Role`/`X-User-Id` headers. Returns 401 (no session) or 403 (wrong role) before any business logic.

## Output location

Write all files at their natural in-tree paths (`prisma/schema.prisma`, `packages/domain/src/schemas/index.ts`, etc.). Existing stubs are replaced in place.

For the Openstrux path: `strux build` emits compiled output to `.openstrux/build/`. The `@openstrux/build` path alias in `tsconfig.json` resolves those files at compile time.
