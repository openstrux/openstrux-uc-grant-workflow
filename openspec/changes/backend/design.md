## Architecture

The backend is a contract-first design. Typed stubs define the contract surfaces; tests import only from these surfaces. Internal file structure within packages is free.

### Contract surfaces

```
src/domain/schemas/index.ts    Zod schemas (entity + API request/response)
                                Single source of truth — all types via z.infer<>

src/policies/index.ts          Barrel exporting pure business-logic functions:
                                evaluateEligibility, createBlindedPacket,
                                isValidTransition, getNextStatus

src/lib/dal.ts                  verifySession(req) → Principal | null

src/server/services/
  submissionService.ts          submitProposal, listSubmissions, getSubmission
  eligibilityService.ts         runEligibilityCheck

src/app/api/
  intake/route.ts               POST — validates with IntakeRequestSchema
  eligibility/route.ts          POST — validates with EligibilityRequestSchema

prisma/schema.prisma            Database models matching domain model
```

### Internal structure (free)

The `src/policies/` barrel may delegate to internal modules. Internal organisation is free — only the barrel exports are tested.

## Output location

Write all files at their natural in-tree paths (`prisma/schema.prisma`, `src/domain/schemas/index.ts`, etc.). Existing stubs are replaced in place.

For the Openstrux path: `strux build` emits compiled output to `.openstrux/build/`. The `@openstrux/build` path alias in `tsconfig.json` resolves those files at compile time.
